import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type SavedChannel = {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  handle?: string;
  videoCount?: number;
  addedAt: string;
};

export type PurchaseRecord = {
  email: string;
  purchasedAt: string;
  source: "stripe-payment-link";
  sessionId?: string;
  customerId?: string;
};

type DatabaseShape = {
  purchases: Record<string, PurchaseRecord>;
  channels: Record<string, SavedChannel[]>;
};

const DB_PATH = join(process.cwd(), ".data", "youtube-channel-tv.json");

const EMPTY_DB: DatabaseShape = {
  purchases: {},
  channels: {}
};

let dbQueue: Promise<void> = Promise.resolve();

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function ensureDbFile() {
  await mkdir(dirname(DB_PATH), { recursive: true });
  try {
    await readFile(DB_PATH, "utf8");
  } catch (error) {
    const maybeError = error as NodeJS.ErrnoException;
    if (maybeError.code !== "ENOENT") {
      throw error;
    }
    await writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2), "utf8");
  }
}

function toDatabaseShape(raw: unknown): DatabaseShape {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_DB };
  }

  const parsed = raw as Partial<DatabaseShape>;

  return {
    purchases: parsed.purchases && typeof parsed.purchases === "object" ? parsed.purchases : {},
    channels: parsed.channels && typeof parsed.channels === "object" ? parsed.channels : {}
  };
}

async function readDb(): Promise<DatabaseShape> {
  await ensureDbFile();
  const contents = await readFile(DB_PATH, "utf8");
  try {
    return toDatabaseShape(JSON.parse(contents));
  } catch {
    return { ...EMPTY_DB };
  }
}

async function writeDb(data: DatabaseShape) {
  await mkdir(dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function runExclusive<T>(fn: (db: DatabaseShape) => Promise<T>): Promise<T> {
  let result: T | undefined;
  let thrown: unknown;

  dbQueue = dbQueue.then(async () => {
    const db = await readDb();
    try {
      result = await fn(db);
    } catch (error) {
      thrown = error;
      return;
    }
    await writeDb(db);
  });

  await dbQueue;

  if (thrown) {
    throw thrown;
  }

  return result as T;
}

export async function recordPurchase(input: {
  email: string;
  sessionId?: string;
  customerId?: string;
}) {
  const email = normalizeEmail(input.email);

  await runExclusive(async (db) => {
    db.purchases[email] = {
      email,
      purchasedAt: new Date().toISOString(),
      source: "stripe-payment-link",
      sessionId: input.sessionId,
      customerId: input.customerId
    };
  });
}

export async function hasPurchase(email: string) {
  const db = await readDb();
  return Boolean(db.purchases[normalizeEmail(email)]);
}

export async function getChannelsForEmail(email: string): Promise<SavedChannel[]> {
  const db = await readDb();
  return db.channels[normalizeEmail(email)] ?? [];
}

export async function addChannelForEmail(
  email: string,
  channel: Omit<SavedChannel, "addedAt">
): Promise<SavedChannel[]> {
  const normalizedEmail = normalizeEmail(email);

  return runExclusive(async (db) => {
    const existing = db.channels[normalizedEmail] ?? [];
    const index = existing.findIndex((item) => item.channelId === channel.channelId);

    const entry: SavedChannel = {
      ...channel,
      addedAt: new Date().toISOString()
    };

    if (index >= 0) {
      existing[index] = {
        ...existing[index],
        ...entry,
        addedAt: existing[index].addedAt
      };
    } else {
      existing.unshift(entry);
    }

    db.channels[normalizedEmail] = existing;
    return existing;
  });
}

export async function removeChannelForEmail(email: string, channelId: string): Promise<SavedChannel[]> {
  const normalizedEmail = normalizeEmail(email);

  return runExclusive(async (db) => {
    const existing = db.channels[normalizedEmail] ?? [];
    db.channels[normalizedEmail] = existing.filter((item) => item.channelId !== channelId);
    return db.channels[normalizedEmail];
  });
}
