import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  Dice6, 
  Package, 
  Wand2,
  Loader2,
  Pause,
  Play,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlayerInputProps {
  onSubmit: (content: string, actionType?: string) => void;
  isProcessing?: boolean;
  characterName?: string;
  suggestions?: string[];
  composure?: number;
  awaitingResponse?: boolean;
  onAutoSubmit?: () => void;
  globalPaused?: boolean;
}

// Calculate response time in seconds based on composure
// 100 composure = 30 seconds, 50 = 15 seconds, 10 = 3 seconds, 0 = no time
function getResponseTime(composure: number): number {
  if (composure <= 0) return 0;
  if (composure >= 100) return 30;
  // Linear scale: 0.3 seconds per composure point
  return Math.max(3, Math.floor(composure * 0.3));
}

export function PlayerInput({ 
  onSubmit, 
  isProcessing, 
  characterName,
  suggestions = [],
  composure = 100,
  awaitingResponse = false,
  onAutoSubmit,
  globalPaused = false,
}: PlayerInputProps) {
  const [content, setContent] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [maxTime, setMaxTime] = useState<number>(30);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track when timer started and pause time to prevent reset on re-render
  const timerStartRef = useRef<number | null>(null);
  const pauseStartRef = useRef<number | null>(null);
  const pausedDurationRef = useRef<number>(0);
  const lastAwaitingRef = useRef<boolean>(false);
  const maxTimeRef = useRef<number>(30); // Store maxTime in ref to avoid stale state

  // Calculate if player has lost control (0 composure)
  const lostControl = composure <= 0;

  // Start timer only when transitioning to awaiting state (not on every render)
  useEffect(() => {
    // Detect transition from not-awaiting to awaiting
    if (awaitingResponse && !lastAwaitingRef.current && !isProcessing && !lostControl) {
      const responseTime = getResponseTime(composure);
      maxTimeRef.current = responseTime; // Store in ref for timer calculation
      setMaxTime(responseTime);
      setTimeRemaining(responseTime);
      timerStartRef.current = Date.now();
      pausedDurationRef.current = 0;
      // Auto-pause on new prompt so player can read
      setIsPaused(true);
    } else if (!awaitingResponse && lastAwaitingRef.current) {
      // Transition from awaiting to not-awaiting - clear timer
      setTimeRemaining(null);
      timerStartRef.current = null;
      pausedDurationRef.current = 0;
    }
    lastAwaitingRef.current = awaitingResponse;
  }, [awaitingResponse, isProcessing, lostControl, composure]);

  // Handle pause/resume by tracking paused duration
  useEffect(() => {
    if (isPaused && pauseStartRef.current === null) {
      // Just paused - record when
      pauseStartRef.current = Date.now();
    } else if (!isPaused && pauseStartRef.current !== null) {
      // Just resumed - add paused duration
      pausedDurationRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [isPaused]);

  // Countdown timer - simple decrement approach
  useEffect(() => {
    // Don't run timer if paused (local or global), processing, or no time remaining
    if (isPaused || globalPaused || isProcessing || timeRemaining === null) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Check if already expired
    if (timeRemaining <= 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (onAutoSubmit) {
        onAutoSubmit();
      } else {
        onSubmit("...", "player_action");
      }
      return;
    }

    // Decrement every 100ms
    const lastTickRef = { time: Date.now() };
    
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.time) / 1000;
      lastTickRef.time = now;
      
      setTimeRemaining(prev => {
        if (prev === null) return null;
        const newTime = Math.max(0, prev - delta);
        return newTime;
      });
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, globalPaused, isProcessing, timeRemaining, onSubmit, onAutoSubmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(() => {
    if (!content.trim() || isProcessing || lostControl) return;
    onSubmit(content.trim(), "player_action");
    setContent("");
    setTimeRemaining(null);
    timerStartRef.current = null;
    pausedDurationRef.current = 0;
  }, [content, isProcessing, lostControl, onSubmit]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDiceRoll = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    onSubmit(`[Rolls a d20: ${roll}]`, "system");
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  useEffect(() => {
    if (!isProcessing && textareaRef.current && !lostControl) {
      textareaRef.current.focus();
    }
  }, [isProcessing, lostControl]);

  const timerProgress = timeRemaining !== null && maxTime > 0 
    ? (timeRemaining / maxTime) * 100 
    : 100;
  
  const timerColor = timerProgress > 50 ? "bg-primary" : timerProgress > 25 ? "bg-yellow-500" : "bg-destructive";

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {timeRemaining !== null && (
        <div className="px-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-100 ${timerColor}`}
                style={{ width: `${timerProgress}%` }}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground min-w-[40px]">
              {timeRemaining.toFixed(1)}s
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={togglePause}
                  data-testid="button-pause-timer"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isPaused ? "Resume timer" : "Pause timer (testing)"}</TooltipContent>
            </Tooltip>
          </div>
          {(isPaused || globalPaused) && (
            <p className="text-xs text-yellow-500 mt-1">
              {globalPaused ? "Game paused" : "Timer paused for testing"}
            </p>
          )}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {suggestions.map((suggestion, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setContent(suggestion)}
              data-testid={`button-suggestion-${idx}`}
            >
              <Wand2 className="h-3 w-3 mr-1" />
              {suggestion}
            </Button>
          ))}
        </div>
      )}

      <div className="p-4">
        <Card className="p-3">
          <div className="flex flex-col gap-3">
            {characterName && (
              <div className="text-xs text-muted-foreground">
                Playing as <span className="font-medium text-foreground">{characterName}</span>
                {awaitingResponse && composure < 100 && (
                  <span className="ml-2 text-yellow-500">
                    (Composure: {composure}% - {maxTime}s to respond)
                  </span>
                )}
              </div>
            )}
            
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your action, speak dialogue, or interact with the world..."
              className="min-h-[80px] resize-none border-0 focus-visible:ring-0 text-base"
              disabled={isProcessing}
              data-testid="input-player-action"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDiceRoll}
                      disabled={isProcessing}
                      data-testid="button-dice-roll"
                    >
                      <Dice6 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Roll d20</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isProcessing}
                      data-testid="button-inventory"
                    >
                      <Package className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Inventory</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {content.length} / 2000
                </span>
                <Button
                  onClick={handleSubmit}
                  disabled={!content.trim() || isProcessing}
                  data-testid="button-submit-action"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
