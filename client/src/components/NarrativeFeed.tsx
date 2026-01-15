import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, User, Sparkles, Globe, MessageSquare } from "lucide-react";
import type { StoryEntry, Character } from "@shared/schema";

interface NarrativeFeedProps {
  entries: StoryEntry[];
  characters: Character[];
  isLoading?: boolean;
  isStreaming?: boolean;
  streamingContent?: string;
}

function getEntryIcon(type: string) {
  switch (type) {
    case "narration":
      return <BookOpen className="h-4 w-4" />;
    case "player_action":
      return <User className="h-4 w-4" />;
    case "dialogue":
      return <MessageSquare className="h-4 w-4" />;
    case "world_event":
      return <Globe className="h-4 w-4" />;
    case "system":
      return <Sparkles className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
}

function getEntryStyles(type: string, playerId?: string | null) {
  switch (type) {
    case "narration":
      return "border-l-4 border-l-primary/60 bg-card/50 font-serif text-lg leading-relaxed";
    case "player_action":
      return playerId 
        ? "ml-auto max-w-[85%] bg-primary/10 border border-primary/20" 
        : "mr-auto max-w-[85%] bg-accent/50 border border-accent/30";
    case "dialogue":
      return "bg-muted/30 italic";
    case "world_event":
      return "text-center text-muted-foreground italic text-sm py-2";
    case "system":
      return "text-center text-muted-foreground/70 text-xs uppercase tracking-wide";
    default:
      return "";
  }
}

function formatTimestamp(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMudContent(content: string) {
  const lines = content.split('\n');
  return lines.map((line, i) => {
    // Location header [Name]
    if (line.match(/^\[.+\]$/)) {
      return (
        <div key={i} className="text-primary font-bold text-xl mb-2">
          {line}
        </div>
      );
    }
    // Also here: line
    if (line.startsWith('Also here:')) {
      return (
        <div key={i} className="mt-3">
          <span className="text-emerald-400 font-semibold">Also here:</span>
          <span>{line.slice(10)}</span>
        </div>
      );
    }
    // Obvious paths: line
    if (line.startsWith('Obvious paths:')) {
      return (
        <div key={i} className="mt-1">
          <span className="text-amber-400 font-semibold">Obvious paths:</span>
          <span>{line.slice(14)}</span>
        </div>
      );
    }
    // Regular line
    return <div key={i}>{line}</div>;
  });
}

export function NarrativeFeed({ 
  entries, 
  characters, 
  isLoading, 
  isStreaming, 
  streamingContent 
}: NarrativeFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, streamingContent]);

  const getCharacterName = (characterId: number | null) => {
    if (!characterId) return null;
    const char = characters.find(c => c.id === characterId);
    return char?.name || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4">
        {entries.length === 0 && !isStreaming && (
          <div 
            className="text-center py-16 text-muted-foreground"
            data-testid="text-empty-feed"
          >
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-serif">Your story awaits...</p>
            <p className="text-sm mt-2">Enter an action below to begin your adventure.</p>
          </div>
        )}

        {entries.map((entry) => {
          const charName = getCharacterName(entry.characterId);
          const styles = getEntryStyles(entry.entryType, entry.playerId);

          return (
            <div
              key={entry.id}
              className={`rounded-md p-4 ${styles} animate-in fade-in duration-200`}
              data-testid={`story-entry-${entry.id}`}
            >
              {entry.entryType !== "system" && entry.entryType !== "world_event" && (
                <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                  <div className="flex items-center gap-2">
                    {entry.entryType === "player_action" && charName ? (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-primary/20">
                          {charName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      getEntryIcon(entry.entryType)
                    )}
                    <span className="font-medium">
                      {entry.entryType === "narration" && "Narrator"}
                      {entry.entryType === "player_action" && charName}
                      {entry.entryType === "dialogue" && charName}
                    </span>
                  </div>
                  <span className="text-xs opacity-60">
                    {formatTimestamp(entry.createdAt)}
                  </span>
                </div>
              )}
              
              {entry.chapterMarker && (
                <div className="text-xs uppercase tracking-widest text-primary/70 mb-2">
                  {entry.chapterMarker}
                </div>
              )}

              <div className="whitespace-pre-wrap">
                {entry.entryType === "narration" ? formatMudContent(entry.content) : entry.content}
              </div>
            </div>
          );
        })}

        {isStreaming && streamingContent && (
          <Card 
            className="border-l-4 border-l-primary/60 bg-card/50 p-4 animate-pulse"
            data-testid="text-streaming-content"
          >
            <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span className="font-medium">Narrator</span>
            </div>
            <div className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
              {formatMudContent(streamingContent)}
              <span className="inline-block w-2 h-5 bg-primary/60 ml-1 animate-pulse" />
            </div>
          </Card>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
