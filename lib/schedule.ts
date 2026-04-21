import { addSeconds } from "date-fns";
import type { Channel } from "@/lib/database";

export interface BroadcastItem {
  id: string;
  kind: "video" | "break";
  title: string;
  durationSec: number;
  videoId?: string;
  sourceUrl?: string;
}

export interface GuideItem {
  id: string;
  title: string;
  kind: "video" | "break";
  start: Date;
  end: Date;
}

export function buildBroadcastLineup(channel: Channel): BroadcastItem[] {
  const lineup: BroadcastItem[] = [];

  channel.programs.forEach((program, index) => {
    lineup.push({
      id: program.id,
      kind: "video",
      title: program.title,
      durationSec: program.durationSec,
      videoId: program.videoId,
      sourceUrl: program.sourceUrl
    });

    const shouldInsertBreak = (index + 1) % channel.breakEvery === 0;

    if (shouldInsertBreak) {
      lineup.push({
        id: `break-${index + 1}`,
        kind: "break",
        title: "Commercial Break",
        durationSec: channel.breakDurationSec
      });
    }
  });

  if (lineup.length === 0) {
    lineup.push({
      id: "fallback-break",
      kind: "break",
      title: "Programming Starts Soon",
      durationSec: 120
    });
  }

  return lineup;
}

function totalCycleDuration(lineup: BroadcastItem[]): number {
  return lineup.reduce((total, item) => total + item.durationSec, 0);
}

export interface PlaybackState {
  index: number;
  offsetSec: number;
  remainingSec: number;
}

export function getPlaybackState(
  lineup: BroadcastItem[],
  anchorDateISO: string,
  now: Date = new Date()
): PlaybackState {
  const cycleDuration = totalCycleDuration(lineup);

  if (cycleDuration <= 0) {
    return {
      index: 0,
      offsetSec: 0,
      remainingSec: lineup[0]?.durationSec ?? 0
    };
  }

  const anchorMs = new Date(anchorDateISO).getTime();
  const elapsedSec = Math.floor((now.getTime() - anchorMs) / 1000);
  const cycleOffset = ((elapsedSec % cycleDuration) + cycleDuration) % cycleDuration;

  let cursor = 0;

  for (let index = 0; index < lineup.length; index += 1) {
    const item = lineup[index];
    const itemEnd = cursor + item.durationSec;

    if (cycleOffset < itemEnd) {
      const offsetSec = cycleOffset - cursor;
      return {
        index,
        offsetSec,
        remainingSec: item.durationSec - offsetSec
      };
    }

    cursor = itemEnd;
  }

  return {
    index: 0,
    offsetSec: 0,
    remainingSec: lineup[0].durationSec
  };
}

export function buildProgramGuide(
  lineup: BroadcastItem[],
  anchorDateISO: string,
  itemCount: number,
  now: Date = new Date()
): GuideItem[] {
  if (lineup.length === 0) {
    return [];
  }

  const state = getPlaybackState(lineup, anchorDateISO, now);
  let currentStart = new Date(now.getTime() - state.offsetSec * 1000);
  const guide: GuideItem[] = [];

  for (let offset = 0; offset < itemCount; offset += 1) {
    const lineupIndex = (state.index + offset) % lineup.length;
    const item = lineup[lineupIndex];
    const end = addSeconds(currentStart, item.durationSec);

    guide.push({
      id: `${item.id}-${offset}`,
      kind: item.kind,
      title: item.title,
      start: currentStart,
      end
    });

    currentStart = end;
  }

  return guide;
}
