import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface ChannelProgram {
  id: string;
  title: string;
  videoId: string;
  sourceUrl: string;
  durationSec: number;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string;
  theme: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
  breakEvery: number;
  breakDurationSec: number;
  programs: ChannelProgram[];
}

interface Purchase {
  id: string;
  email: string;
  provider: "stripe";
  providerEventId: string;
  purchasedAt: string;
  status: "active";
}

interface DatabaseShape {
  channels: Channel[];
  purchases: Purchase[];
}

const dataDirectory = path.join(process.cwd(), "data");
const dataFile = path.join(dataDirectory, "store.json");

const seededChannels: Channel[] = [
  {
    id: "retro-music-tv",
    name: "Retro Music TV",
    slug: "retro-music-tv",
    description:
      "A nonstop rotation of iconic throwback music videos with TV-style pacing and interstitial breaks.",
    theme: "Neon nostalgia",
    logoUrl: "https://i.ytimg.com/vi/hTWKbfoikeg/hqdefault.jpg",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
    breakEvery: 3,
    breakDurationSec: 90,
    programs: [
      {
        id: randomUUID(),
        title: "Nirvana - Smells Like Teen Spirit",
        videoId: "hTWKbfoikeg",
        sourceUrl: "https://www.youtube.com/watch?v=hTWKbfoikeg",
        durationSec: 301
      },
      {
        id: randomUUID(),
        title: "a-ha - Take On Me",
        videoId: "djV11Xbc914",
        sourceUrl: "https://www.youtube.com/watch?v=djV11Xbc914",
        durationSec: 225
      },
      {
        id: randomUUID(),
        title: "Red Hot Chili Peppers - Californication",
        videoId: "YlUKcNNmywk",
        sourceUrl: "https://www.youtube.com/watch?v=YlUKcNNmywk",
        durationSec: 329
      },
      {
        id: randomUUID(),
        title: "Oasis - Wonderwall",
        videoId: "bx1Bh8ZvH84",
        sourceUrl: "https://www.youtube.com/watch?v=bx1Bh8ZvH84",
        durationSec: 259
      }
    ]
  },
  {
    id: "kitchen-marathon",
    name: "Kitchen Marathon",
    slug: "kitchen-marathon",
    description:
      "Back-to-back cooking content for a relaxed food TV vibe all day long.",
    theme: "Warm studio",
    logoUrl: "https://i.ytimg.com/vi/1-SJGQ2HLp8/hqdefault.jpg",
    createdAt: "2026-01-16T00:00:00.000Z",
    updatedAt: "2026-01-16T00:00:00.000Z",
    breakEvery: 2,
    breakDurationSec: 75,
    programs: [
      {
        id: randomUUID(),
        title: "Easy Roast Chicken",
        videoId: "1-SJGQ2HLp8",
        sourceUrl: "https://www.youtube.com/watch?v=1-SJGQ2HLp8",
        durationSec: 860
      },
      {
        id: randomUUID(),
        title: "5-Minute Weeknight Pasta",
        videoId: "3AAdKl1UYZs",
        sourceUrl: "https://www.youtube.com/watch?v=3AAdKl1UYZs",
        durationSec: 672
      },
      {
        id: randomUUID(),
        title: "Restaurant-Style Fried Rice",
        videoId: "z8Y88GS7TSg",
        sourceUrl: "https://www.youtube.com/watch?v=z8Y88GS7TSg",
        durationSec: 512
      }
    ]
  }
];

const emptyDb: DatabaseShape = {
  channels: seededChannels,
  purchases: []
};

let writeQueue = Promise.resolve();

async function ensureDataFile(): Promise<void> {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, JSON.stringify(emptyDb, null, 2), "utf8");
  }
}

async function readDb(): Promise<DatabaseShape> {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  return JSON.parse(raw) as DatabaseShape;
}

async function writeDb(nextDb: DatabaseShape): Promise<void> {
  writeQueue = writeQueue.then(() => writeFile(dataFile, JSON.stringify(nextDb, null, 2), "utf8"));
  await writeQueue;
}

export async function listChannels(): Promise<Channel[]> {
  const db = await readDb();
  return db.channels.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getChannelById(id: string): Promise<Channel | null> {
  const db = await readDb();
  return db.channels.find((channel) => channel.id === id) ?? null;
}

interface CreateChannelInput {
  name: string;
  description: string;
  theme: string;
  logoUrl: string;
  breakEvery?: number;
  breakDurationSec?: number;
  programs: ChannelProgram[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}

export async function createChannel(input: CreateChannelInput): Promise<Channel> {
  const db = await readDb();
  const baseSlug = slugify(input.name) || "channel";

  const slugSet = new Set(db.channels.map((channel) => channel.slug));
  let slug = baseSlug;
  let index = 1;

  while (slugSet.has(slug)) {
    index += 1;
    slug = `${baseSlug}-${index}`;
  }

  const now = new Date().toISOString();
  const channel: Channel = {
    id: `${slug}-${Math.floor(Math.random() * 10000)}`,
    name: input.name,
    slug,
    description: input.description,
    theme: input.theme,
    logoUrl: input.logoUrl,
    createdAt: now,
    updatedAt: now,
    breakEvery: input.breakEvery ?? 3,
    breakDurationSec: input.breakDurationSec ?? 90,
    programs: input.programs
  };

  db.channels.push(channel);
  await writeDb(db);
  return channel;
}

export async function addStripePurchase(email: string, providerEventId: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = await readDb();

  if (db.purchases.some((purchase) => purchase.providerEventId === providerEventId)) {
    return;
  }

  db.purchases.push({
    id: randomUUID(),
    email: normalizedEmail,
    provider: "stripe",
    providerEventId,
    purchasedAt: new Date().toISOString(),
    status: "active"
  });

  await writeDb(db);
}

export async function hasActivePurchase(email: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const db = await readDb();

  return db.purchases.some(
    (purchase) => purchase.email === normalizedEmail && purchase.status === "active"
  );
}
