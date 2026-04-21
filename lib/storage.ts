import { promises as fs } from "node:fs";
import path from "node:path";

import type { UserLineup, YouTubeChannel } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const LINEUPS_FILE = path.join(DATA_DIR, "lineups.json");

type LineupMap = Record<string, Omit<UserLineup, "email">>;

async function ensureLineupFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(LINEUPS_FILE);
  } catch {
    await fs.writeFile(LINEUPS_FILE, "{}", "utf8");
  }
}

async function readLineups(): Promise<LineupMap> {
  await ensureLineupFile();

  const raw = await fs.readFile(LINEUPS_FILE, "utf8");
  try {
    return JSON.parse(raw) as LineupMap;
  } catch {
    return {};
  }
}

async function writeLineups(data: LineupMap) {
  await ensureLineupFile();
  await fs.writeFile(LINEUPS_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function getLineupByEmail(email: string): Promise<UserLineup> {
  const normalized = email.trim().toLowerCase();
  const lineups = await readLineups();
  const existing = lineups[normalized];

  if (!existing) {
    return {
      email: normalized,
      channels: [],
      updatedAt: new Date(0).toISOString()
    };
  }

  return {
    email: normalized,
    channels: existing.channels ?? [],
    updatedAt: existing.updatedAt
  };
}

export async function saveLineupByEmail(email: string, channels: YouTubeChannel[]): Promise<UserLineup> {
  const normalized = email.trim().toLowerCase();
  const lineups = await readLineups();
  const deduped = dedupeChannels(channels);

  const payload: Omit<UserLineup, "email"> = {
    channels: deduped,
    updatedAt: new Date().toISOString()
  };

  lineups[normalized] = payload;
  await writeLineups(lineups);

  return {
    email: normalized,
    ...payload
  };
}

function dedupeChannels(channels: YouTubeChannel[]) {
  const seen = new Set<string>();
  const result: YouTubeChannel[] = [];

  for (const channel of channels) {
    if (!channel?.id || seen.has(channel.id)) {
      continue;
    }

    seen.add(channel.id);
    result.push(channel);
  }

  return result;
}
