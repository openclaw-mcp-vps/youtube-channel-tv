import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { TVChannel } from "@/lib/types";

type PurchaseRecord = {
  email: string;
  provider: "stripe";
  purchasedAt: string;
  eventId?: string;
  amountTotal?: number;
  currency?: string;
};

type PurchaseState = {
  purchases: PurchaseRecord[];
};

const dataDir = path.join(process.cwd(), "data");
const lineupsFile = path.join(dataDir, "lineups.json");
const purchasesFile = path.join(dataDir, "purchases.json");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, value: T) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

export function normalizeUserKey(value: string) {
  return crypto
    .createHash("sha256")
    .update(value.trim().toLowerCase())
    .digest("hex");
}

export async function getUserChannels(userKey: string): Promise<TVChannel[]> {
  const allLineups = await readJson<Record<string, TVChannel[]>>(lineupsFile, {});
  return allLineups[userKey] ?? [];
}

export async function addUserChannel(userKey: string, channel: TVChannel) {
  const allLineups = await readJson<Record<string, TVChannel[]>>(lineupsFile, {});
  const current = allLineups[userKey] ?? [];

  const deduped = current.filter((item) => item.channelId !== channel.channelId);
  const next = [channel, ...deduped].slice(0, 40);

  allLineups[userKey] = next;
  await writeJson(lineupsFile, allLineups);

  return next;
}

export async function removeUserChannel(userKey: string, channelId: string) {
  const allLineups = await readJson<Record<string, TVChannel[]>>(lineupsFile, {});
  const current = allLineups[userKey] ?? [];

  const next = current.filter((channel) => channel.channelId !== channelId);

  allLineups[userKey] = next;
  await writeJson(lineupsFile, allLineups);

  return next;
}

export async function addPurchase(record: PurchaseRecord) {
  const state = await readJson<PurchaseState>(purchasesFile, { purchases: [] });

  const eventAlreadySaved =
    Boolean(record.eventId) &&
    state.purchases.some((existing) => existing.eventId === record.eventId);

  if (eventAlreadySaved) {
    return;
  }

  const email = record.email.trim().toLowerCase();

  state.purchases = [
    {
      ...record,
      email
    },
    ...state.purchases.filter(
      (existing) => existing.email !== email || existing.provider !== record.provider
    )
  ];

  await writeJson(purchasesFile, state);
}

export async function hasPurchased(email: string) {
  const state = await readJson<PurchaseState>(purchasesFile, { purchases: [] });
  const normalized = email.trim().toLowerCase();
  return state.purchases.some((record) => record.email === normalized);
}
