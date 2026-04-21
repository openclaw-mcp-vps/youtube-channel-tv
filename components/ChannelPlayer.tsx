"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import YouTubePlayer from "youtube-player";
import { Send, Tv, Volume2 } from "lucide-react";
import type { BroadcastItem } from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlayerInstance = ReturnType<typeof YouTubePlayer>;

interface ChatMessage {
  id: string;
  author: string;
  text: string;
  at: string;
}

interface ChannelPlayerProps {
  channelId: string;
  channelName: string;
  lineup: BroadcastItem[];
  initialIndex: number;
  initialOffsetSec: number;
}

export function ChannelPlayer({
  channelId,
  channelName,
  lineup,
  initialIndex,
  initialOffsetSec
}: ChannelPlayerProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const playerRef = useRef<PlayerInstance | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const offsetConsumedRef = useRef(false);

  const currentItem = lineup[activeIndex];

  const firstVideo = useMemo(
    () => lineup.find((item) => item.kind === "video" && item.videoId)?.videoId,
    [lineup]
  );

  useEffect(() => {
    const key = `yttv-chat-${channelId}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      setMessages(JSON.parse(saved) as ChatMessage[]);
      return;
    }

    setMessages([
      {
        id: "welcome",
        author: "Channel Bot",
        text: `Welcome to ${channelName}. Drop your reactions as the lineup rolls.`,
        at: new Date().toISOString()
      }
    ]);
  }, [channelId, channelName]);

  useEffect(() => {
    const key = `yttv-chat-${channelId}`;
    localStorage.setItem(key, JSON.stringify(messages.slice(-50)));
  }, [channelId, messages]);

  useEffect(() => {
    if (!playerContainerRef.current || !firstVideo) {
      return;
    }

    const player = YouTubePlayer(playerContainerRef.current, {
      videoId: firstVideo,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0
      }
    });

    playerRef.current = player;

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      player.destroy();
      playerRef.current = null;
    };
  }, [firstVideo]);

  useEffect(() => {
    if (!currentItem) {
      return;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const advance = (): void => {
      setActiveIndex((prev) => (prev + 1) % lineup.length);
    };

    if (currentItem.kind === "break") {
      setSecondsRemaining(currentItem.durationSec);

      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(prev - 1, 0));
      }, 1000);

      timeoutRef.current = setTimeout(advance, currentItem.durationSec * 1000);
      return;
    }

    if (currentItem.kind === "video" && currentItem.videoId && playerRef.current) {
      const startSeconds =
        activeIndex === initialIndex && !offsetConsumedRef.current ? initialOffsetSec : 0;

      offsetConsumedRef.current = true;
      playerRef.current.loadVideoById(currentItem.videoId, startSeconds);

      const playbackDuration = Math.max(currentItem.durationSec - startSeconds, 1);
      setSecondsRemaining(playbackDuration);

      countdownRef.current = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(prev - 1, 0));
      }, 1000);

      timeoutRef.current = setTimeout(advance, playbackDuration * 1000);
    }
  }, [activeIndex, currentItem, initialIndex, initialOffsetSec, lineup.length]);

  const submitMessage = (): void => {
    const trimmed = chatInput.trim();

    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        author: "You",
        text: trimmed,
        at: new Date().toISOString()
      }
    ]);
    setChatInput("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.65fr_1fr]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Tv className="h-5 w-5 text-cyan-300" />
            {channelName}
          </CardTitle>
          <Badge variant={currentItem.kind === "break" ? "muted" : "alert"}>
            {currentItem.kind === "break" ? "Commercial Break" : "Now Playing"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-700 bg-black">
            <div className="aspect-video w-full">
              {currentItem.kind === "break" ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(35,166,213,0.35),_transparent_50%),_#06080b] px-6 text-center">
                  <Volume2 className="h-8 w-8 text-cyan-300" />
                  <p className="text-xl font-semibold text-slate-100">Commercial break in progress</p>
                  <p className="text-sm text-slate-400">
                    Channel returns to regular programming in {secondsRemaining}s
                  </p>
                </div>
              ) : (
                <div ref={playerContainerRef} className="h-full w-full" />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Current Segment</p>
              <p className="text-sm font-medium text-slate-100">{currentItem.title}</p>
            </div>
            <p className="text-sm text-slate-300">Switching in {secondsRemaining}s</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Viewer Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3">
            {messages.map((message) => (
              <div key={message.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2">
                <p className="text-xs text-cyan-300">{message.author}</p>
                <p className="text-sm text-slate-100">{message.text}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={chatInput}
              placeholder="Say something about this segment..."
              onChange={(event) => setChatInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitMessage();
                }
              }}
            />
            <Button type="button" size="sm" onClick={submitMessage}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
