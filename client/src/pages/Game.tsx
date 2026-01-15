import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NarrativeFeed } from "@/components/NarrativeFeed";
import { PlayerInput } from "@/components/PlayerInput";
import { WorldStateSidebar } from "@/components/WorldStateSidebar";
import { CharacterSheet } from "@/components/CharacterSheet";
import { PresenceIndicator } from "@/components/PresenceIndicator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  Menu, 
  Settings, 
  Users,
  Scroll,
  Pause,
  Play,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameWorld, Character, StoryEntry, CharacterStatus } from "@shared/schema";

export default function Game() {
  const params = useParams<{ id: string }>();
  const worldId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [playerStatus, setPlayerStatus] = useState<CharacterStatus | null>(null);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [isGamePaused, setIsGamePaused] = useState(true); // Start paused for reading
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const { data: world, isLoading: worldLoading } = useQuery<GameWorld>({
    queryKey: ["/api/worlds", worldId],
    enabled: !!worldId,
  });

  const { data: characters = [], isLoading: charsLoading } = useQuery<Character[]>({
    queryKey: ["/api/worlds", worldId, "characters"],
    enabled: !!worldId,
  });

  const { data: storyEntries = [], isLoading: entriesLoading } = useQuery<StoryEntry[]>({
    queryKey: ["/api/worlds", worldId, "story"],
    enabled: !!worldId,
    refetchInterval: isStreaming ? false : 5000,
  });

  const playerCharacter = characters.find(c => !c.isNpc && c.isActive);
  
  // Initialize player status from character data
  useEffect(() => {
    if (playerCharacter?.status) {
      setPlayerStatus(playerCharacter.status as CharacterStatus);
    }
  }, [playerCharacter?.status]);

  // Initialize awaiting state from world data or last story entry
  useEffect(() => {
    const worldState = (world?.worldState || {}) as { awaitingPlayerResponse?: boolean };
    if (worldState.awaitingPlayerResponse) {
      setAwaitingResponse(true);
    } else if (storyEntries.length > 0) {
      // Check if last entry has an allow/resist prompt
      const lastEntry = storyEntries[storyEntries.length - 1];
      if (lastEntry.content?.includes('You can: allow or resist')) {
        setAwaitingResponse(true);
      }
    }
  }, [world?.worldState, storyEntries]);

  // Ambient update polling - generates NPC actions periodically
  const playerHasComposure = (playerStatus?.composure ?? 100) > 0;
  const pausedRef = useRef(isGamePaused);
  const ambientAbortRef = useRef<AbortController | null>(null);
  
  // Keep ref in sync with state and notify server of pause state
  useEffect(() => {
    pausedRef.current = isGamePaused;
    // If paused, abort any in-flight ambient request
    if (isGamePaused && ambientAbortRef.current) {
      ambientAbortRef.current.abort();
      ambientAbortRef.current = null;
    }
    // Notify server of pause state so it can discard in-progress generations
    if (worldId) {
      fetch(`/api/worlds/${worldId}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paused: isGamePaused }),
      }).catch(() => {}); // Silently fail
    }
  }, [isGamePaused, worldId]);
  
  useEffect(() => {
    // Don't poll if paused, streaming, or if awaiting player response (unless player has no composure)
    if (!worldId || isGamePaused || isStreaming) return;
    if (awaitingResponse && playerHasComposure) return; // Only stop if player CAN respond
    
    const pollAmbient = async () => {
      // Double-check pause state before making request
      if (pausedRef.current) return;
      
      try {
        ambientAbortRef.current = new AbortController();
        const response = await fetch(`/api/worlds/${worldId}/ambient`, {
          method: "POST",
          signal: ambientAbortRef.current.signal,
        });
        
        // Check if paused during the request
        if (pausedRef.current) return;
        
        const data = await response.json();
        if (data && !data.skipped) {
          queryClient.invalidateQueries({ queryKey: ["/api/worlds", worldId, "story"] });
          queryClient.invalidateQueries({ queryKey: ["/api/worlds", worldId, "characters"] });
          // Update local player status if received
          if (data.statusUpdate) {
            setPlayerStatus(data.statusUpdate);
          }
          // If NPC took action on player, pause further ambient updates until player responds
          if (data.attemptOnPlayer) {
            setAwaitingResponse(true);
          }
        }
      } catch (e) {
        // Silently fail - ambient updates are optional (includes AbortError)
      } finally {
        ambientAbortRef.current = null;
      }
    };

    // Initial poll immediately on unpause/mount
    pollAmbient();
    
    // Then poll every 10-20 seconds (randomized)
    const interval = setInterval(() => {
      pollAmbient();
    }, 10000 + Math.random() * 10000);

    return () => clearInterval(interval);
  }, [worldId, isGamePaused, isStreaming, awaitingResponse, playerHasComposure]);

  const submitActionMutation = useMutation({
    mutationFn: async ({ content, actionType }: { content: string; actionType: string }) => {
      setIsStreaming(true);
      setStreamingContent("");
      // Clear awaiting response flag - player has responded
      setAwaitingResponse(false);
      
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(`/api/worlds/${worldId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          actionType,
          characterId: playerCharacter?.id,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to submit action");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  fullContent += data.content;
                  setStreamingContent(fullContent);
                }
                if (data.statusUpdate) {
                  setPlayerStatus(data.statusUpdate);
                }
                if (data.climaxed) {
                  toast({
                    title: "Climax!",
                    description: "You reached climax.",
                  });
                }
                if (data.done) {
                  queryClient.invalidateQueries({ queryKey: ["/api/worlds", worldId, "story"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/worlds", worldId, "characters"] });
                }
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                if (e instanceof SyntaxError) continue;
                throw e;
              }
            }
          }
        }
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    onError: (error) => {
      setIsStreaming(false);
      setStreamingContent("");
      toast({
        title: "Error",
        description: error.message || "Failed to process action",
        variant: "destructive",
      });
    },
  });

  const handleSubmitAction = useCallback((content: string, actionType: string = "player_action") => {
    submitActionMutation.mutate({ content, actionType });
  }, [submitActionMutation]);

  // When timer expires, trigger NPC to take action instead of submitting player "..."
  const handleAutoSubmit = useCallback(async () => {
    try {
      const response = await fetch(`/api/worlds/${worldId}/ambient`, {
        method: "POST",
      });
      const data = await response.json();
      if (data && !data.skipped) {
        queryClient.invalidateQueries({ queryKey: ["/api/worlds", worldId, "story"] });
        if (data.attemptOnPlayer) {
          setAwaitingResponse(true);
        }
      }
    } catch (e) {
      // Silently fail
    }
  }, [worldId]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  if (worldLoading || charsLoading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <header className="h-14 border-b flex items-center px-4 gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
        </header>
        <div className="flex-1 p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!world) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">World not found</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!playerCharacter) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md">
          <Scroll className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Character Selected</h2>
          <p className="text-muted-foreground mb-4">
            You need to create a character before entering {world.name}.
          </p>
          <Button onClick={() => navigate(`/game/${worldId}/setup`)}>
            Create Character
          </Button>
        </div>
      </div>
    );
  }

  const mockPlayers = [
    { id: "1", name: playerCharacter.name, isOnline: true, characterName: playerCharacter.name },
  ];

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="h-14 border-b flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="hidden md:flex items-center gap-2">
            <Scroll className="h-5 w-5 text-primary" />
            <span className="font-semibold truncate max-w-[200px]" data-testid="text-game-world-name">
              {world.name}
            </span>
          </div>

          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <WorldStateSidebar
                world={world}
                characters={characters}
                storyEntries={storyEntries}
                onCharacterSelect={setSelectedCharacter}
                playerStatus={playerStatus}
              />
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex items-center gap-3">
          <PresenceIndicator players={mockPlayers} currentPlayerId="1" />
          
          <Button 
            variant={isGamePaused ? "default" : "outline"}
            size="sm"
            onClick={() => setIsGamePaused(!isGamePaused)}
            data-testid="button-pause-game"
            className="gap-2"
          >
            {isGamePaused ? (
              <>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                <span className="hidden sm:inline">Pause</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(`/game/${worldId}/setup`)}
            data-testid="button-settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          
          <ThemeToggle />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:block w-80 border-r overflow-hidden">
          <WorldStateSidebar
            world={world}
            characters={characters}
            storyEntries={storyEntries}
            onCharacterSelect={setSelectedCharacter}
            playerStatus={playerStatus}
          />
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden">
          <NarrativeFeed
            entries={storyEntries}
            characters={characters}
            isLoading={entriesLoading}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />

          <PlayerInput
            onSubmit={handleSubmitAction}
            onAutoSubmit={handleAutoSubmit}
            isProcessing={isStreaming || submitActionMutation.isPending}
            characterName={playerCharacter.name}
            composure={playerStatus?.composure ?? 100}
            awaitingResponse={awaitingResponse}
            globalPaused={isGamePaused}
          />
        </main>
      </div>

      <CharacterSheet
        character={selectedCharacter}
        open={!!selectedCharacter}
        onClose={() => setSelectedCharacter(null)}
      />
    </div>
  );
}
