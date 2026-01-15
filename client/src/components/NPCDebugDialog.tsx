import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Gauge, 
  Brain, 
  Heart, 
  Flame, 
  Shirt,
  MapPin,
  Zap
} from "lucide-react";

interface NPCDebugInfo {
  id: number;
  name: string;
  description: string;
  personality: string | null;
  background: string | null;
  goals: string | null;
  traits: string[] | null;
  sexualPersonality: string;
  personalityMatrix: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  } | null;
  arousalTriggers: string[];
  arousalInhibitors: string[];
  status: {
    arousal: number;
    climax: number;
    composure: number;
  } | null;
  currentPosition: string;
  currentClothing: string;
  currentIntimacyStage: number;
  sceneGoal: {
    objective: string;
    approach: string;
    paceModifier: number;
    preferredActions: string[];
  };
  scenarioGoal: string;
  currentActivityMode: string;
  playerClothing: string;
  stateHistory: Array<{
    timestamp: number;
    npcPosition: string;
    npcClothing: string;
    playerClothing: string;
    activityMode: string;
  }>;
}

interface NPCDebugDialogProps {
  npcId: number | null;
  open: boolean;
  onClose: () => void;
}

export function NPCDebugDialog({ npcId, open, onClose }: NPCDebugDialogProps) {
  const [debugInfo, setDebugInfo] = useState<NPCDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (npcId && open) {
      setLoading(true);
      fetch(`/api/characters/${npcId}/debug`)
        .then(res => res.json())
        .then(data => {
          setDebugInfo(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [npcId, open]);

  const getPaceLabel = (modifier: number) => {
    if (modifier < 0.7) return "Very Slow";
    if (modifier < 0.9) return "Slow";
    if (modifier < 1.1) return "Normal";
    if (modifier < 1.4) return "Fast";
    return "Very Fast";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            {debugInfo?.name || "NPC"} - Debug Info
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : debugInfo ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase text-muted-foreground mb-1">Description</h4>
                <p className="text-sm">{debugInfo.description}</p>
              </div>

              {debugInfo.personality && (
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground mb-1">Personality</h4>
                  <p className="text-sm">{debugInfo.personality}</p>
                </div>
              )}

              <Separator />

              {debugInfo.scenarioGoal && debugInfo.scenarioGoal !== "No scenario goal set" && (
                <div className="bg-accent/20 border border-accent/40 rounded-md p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-accent-foreground" />
                    <span className="font-semibold text-sm">Scenario Goal (Overall)</span>
                  </div>
                  <p className="text-sm">{debugInfo.scenarioGoal}</p>
                </div>
              )}

              <div className="bg-primary/10 border border-primary/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Current Scene Goal</span>
                </div>
                <p className="text-sm font-medium mb-2">"{debugInfo.sceneGoal.objective}"</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">Approach: {debugInfo.sceneGoal.approach}</Badge>
                  <Badge variant="secondary">Pace: {getPaceLabel(debugInfo.sceneGoal.paceModifier)} ({debugInfo.sceneGoal.paceModifier.toFixed(1)}x)</Badge>
                  {debugInfo.currentActivityMode && debugInfo.currentActivityMode !== "none" && (
                    <Badge variant="outline">Mode: {debugInfo.currentActivityMode}</Badge>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Preferred: </span>
                  <span className="text-xs">{debugInfo.sceneGoal.preferredActions.join(", ")}</span>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Sexual Personality
                  </h4>
                  <Badge>{debugInfo.sexualPersonality.toUpperCase()}</Badge>
                </div>
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <Gauge className="h-3 w-3" /> Intimacy Stage
                  </h4>
                  <span className="text-sm font-medium">{debugInfo.currentIntimacyStage}</span>
                </div>
              </div>

              {debugInfo.status && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase text-muted-foreground">Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-pink-500" />
                      <span className="text-xs w-16">Arousal</span>
                      <span className="text-xs font-medium">{debugInfo.status.arousal}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-3 w-3 text-orange-500" />
                      <span className="text-xs w-16">Climax</span>
                      <Progress value={debugInfo.status.climax} className="h-2 flex-1" />
                      <span className="text-xs">{debugInfo.status.climax}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-3 w-3 text-purple-500" />
                      <span className="text-xs w-16">Composure</span>
                      <Progress value={debugInfo.status.composure} className="h-2 flex-1" />
                      <span className="text-xs">{debugInfo.status.composure}%</span>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> NPC Position
                  </h4>
                  <p className="text-sm">{debugInfo.currentPosition}</p>
                </div>
                <div>
                  <h4 className="text-xs uppercase text-muted-foreground mb-1 flex items-center gap-1">
                    <Shirt className="h-3 w-3" /> NPC Clothing
                  </h4>
                  <p className="text-sm">{debugInfo.currentClothing}</p>
                </div>
              </div>
              
              <div className="mt-2">
                <h4 className="text-xs uppercase text-muted-foreground mb-1">Player Clothing State</h4>
                <Badge variant="outline">{debugInfo.playerClothing}</Badge>
              </div>

              {debugInfo.personalityMatrix && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs uppercase text-muted-foreground mb-2">Big Five Traits</h4>
                    <div className="space-y-1 text-xs">
                      {(() => {
                        // Handle nested bigFive structure or flat structure
                        const matrix = debugInfo.personalityMatrix as Record<string, unknown>;
                        const bigFive = (matrix.bigFive as Record<string, number>) || matrix;
                        
                        // Filter to only numeric values (the actual traits)
                        const traits = Object.entries(bigFive).filter(
                          ([, v]) => typeof v === 'number'
                        ) as [string, number][];
                        
                        return traits.map(([trait, value]) => (
                          <div key={trait} className="flex items-center gap-2">
                            <span className="w-28 capitalize">{trait}</span>
                            <Progress value={value} className="h-2 flex-1" />
                            <span className="w-8 text-right">{value}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </>
              )}

              {(debugInfo.arousalTriggers.length > 0 || debugInfo.arousalInhibitors.length > 0) && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    {debugInfo.arousalTriggers.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase text-muted-foreground mb-1">Arousal Triggers</h4>
                        <div className="flex flex-wrap gap-1">
                          {debugInfo.arousalTriggers.map((t, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {debugInfo.arousalInhibitors.length > 0 && (
                      <div>
                        <h4 className="text-xs uppercase text-muted-foreground mb-1">Inhibitors</h4>
                        <div className="flex flex-wrap gap-1">
                          {debugInfo.arousalInhibitors.map((t, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {debugInfo.goals && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs uppercase text-muted-foreground mb-1">Long-term Goals</h4>
                    <p className="text-sm">{debugInfo.goals}</p>
                  </div>
                </>
              )}

              {debugInfo.stateHistory && debugInfo.stateHistory.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-xs uppercase text-muted-foreground mb-2">State History (Recent)</h4>
                    <div className="space-y-2">
                      {debugInfo.stateHistory.slice().reverse().map((snapshot, i) => (
                        <div key={i} className="text-xs bg-muted/30 rounded p-2 space-y-1">
                          <div className="text-muted-foreground">
                            {new Date(snapshot.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <span className="text-muted-foreground">NPC Position:</span>
                            <span>{snapshot.npcPosition}</span>
                            <span className="text-muted-foreground">NPC Clothing:</span>
                            <span>{snapshot.npcClothing}</span>
                            <span className="text-muted-foreground">Player Clothing:</span>
                            <span>{snapshot.playerClothing}</span>
                            <span className="text-muted-foreground">Activity Mode:</span>
                            <span>{snapshot.activityMode}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No data available</div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
