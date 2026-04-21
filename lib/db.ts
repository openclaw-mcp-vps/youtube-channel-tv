import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { normalizeEmail } from "@/lib/utils";

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

export interface PurchaseRecord {
  email: string;
  provider: "stripe";
  eventId: string;
  createdAt: string;
}

export interface AppDatabase {
  users: UserRecord[];
  lineups: Record<string, string[]>;
  purchases: PurchaseRecord[];
  processedWebhookEvents: string[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "app-db.json");

const EMPTY_DB: AppDatabase = {
  users: [],
  lineups: {},
  purchases: [],
  processedWebhookEvents: []
};

let queue: Promise<unknown> = Promise.resolve();

function runExclusive<T>(task: () => Promise<T>) {
  const result = queue.then(task, task);
  queue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function ensureDbFile() {
  await mkdir(DATA_DIR, { recursive: true });

  try {
    await readFile(DB_PATH, "utf-8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
  }
}

async function readDb() {
  await ensureDbFile();
  const file = await readFile(DB_PATH, "utf-8");

  try {
    const parsed = JSON.parse(file) as AppDatabase;
    return {
      users: parsed.users ?? [],
      lineups: parsed.lineups ?? {},
      purchases: parsed.purchases ?? [],
      processedWebhookEvents: parsed.processedWebhookEvents ?? []
    } satisfies AppDatabase;
  } catch {
    await writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
    return { ...EMPTY_DB };
  }
}

async function writeDb(nextDb: AppDatabase) {
  await writeFile(DB_PATH, JSON.stringify(nextDb, null, 2));
}

export async function getUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const db = await readDb();
  return db.users.find((user) => user.email === normalized) ?? null;
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  passwordSalt: string;
}) {
  return runExclusive(async () => {
    const normalized = normalizeEmail(input.email);
    const db = await readDb();

    const existing = db.users.find((user) => user.email === normalized);
    if (existing) {
      return existing;
    }

    const user: UserRecord = {
      id: randomUUID(),
      email: normalized,
      passwordHash: input.passwordHash,
      passwordSalt: input.passwordSalt,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    await writeDb(db);

    return user;
  });
}

export async function getLineup(email: string) {
  const normalized = normalizeEmail(email);
  const db = await readDb();
  return db.lineups[normalized] ?? [];
}

export async function saveLineup(email: string, channelIds: string[]) {
  return runExclusive(async () => {
    const normalized = normalizeEmail(email);
    const db = await readDb();

    db.lineups[normalized] = channelIds;
    await writeDb(db);

    return db.lineups[normalized];
  });
}

export async function markPurchase(input: {
  email: string;
  provider: "stripe";
  eventId: string;
}) {
  return runExclusive(async () => {
    const normalized = normalizeEmail(input.email);
    const db = await readDb();

    if (db.processedWebhookEvents.includes(input.eventId)) {
      return false;
    }

    db.processedWebhookEvents.push(input.eventId);

    const exists = db.purchases.some(
      (purchase) => purchase.email === normalized && purchase.provider === input.provider
    );

    if (!exists) {
      db.purchases.push({
        email: normalized,
        provider: input.provider,
        eventId: input.eventId,
        createdAt: new Date().toISOString()
      });
    }

    await writeDb(db);
    return true;
  });
}

export async function hasPurchase(email: string) {
  const normalized = normalizeEmail(email);
  const db = await readDb();
  return db.purchases.some((purchase) => purchase.email === normalized);
}
