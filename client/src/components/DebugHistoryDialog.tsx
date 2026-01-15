import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { History, Clock, Camera } from "lucide-react";

interface DebugSnapshot {
  timestamp: number;
  label: string;
  worldState: {
    scenarioGoal?: string;
    currentActivityMode?: string;
    playerClothing?: string;
    npcStates?: Record<string, string>;
    npcClothing?: Record<string, string>;
  };
  characters: Array<{
    name: string;
    isNpc: boolean;
    status: { arousal?: number; climax?: number; composure?: number } | null;
  }>;
  recentNarration: string[];
}

interface DebugHistoryDialogProps {
  worldId: number | null;
  open: boolean;
  onClose: () => void;
}

export function DebugHistoryDialog({ worldId, open, onClose }: DebugHistoryDialogProps) {
  const [history, setHistory] = useState<DebugSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (worldId && open) {
      setLoading(true);
      fetch(`/api/worlds/${worldId}/debug-history`)
        .then(res => res.json())
        .then(data => {
          setHistory(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [worldId, open]);

  const saveSnapshot = async () => {
    if (!worldId) return;
    setSaving(true);
    try {
      await fetch(`/api/worlds/${worldId}/debug-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: `Manual snapshot` }),
      });
      const res = await fetch(`/api/worlds/${worldId}/debug-history`);
      setHistory(await res.json());
    } catch {
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Debug History
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-2">
          <Button 
            size="sm" 
            onClick={saveSnapshot} 
            disabled={saving}
            data-testid="button-save-snapshot"
          >
            <Camera className="h-4 w-4 mr-1" />
            {saving ? "Saving..." : "Save Snapshot"}
          </Button>
        </div>
        
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No debug history yet. Click "Save Snapshot" to capture current state.
            </div>
          ) : (
            <div className="space-y-4">
              {history.slice().reverse().map((snapshot, i) => (
                <div key={i} className="border rounded-md p-3 bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{snapshot.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <Separator className="my-2" />
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Activity Mode:</span>
                      <Badge variant="outline" className="ml-2">
                        {snapshot.worldState.currentActivityMode || "none"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Player Clothing:</span>
                      <span className="ml-2">{snapshot.worldState.playerClothing || "fully clothed"}</span>
                    </div>
                  </div>
                  
                  {snapshot.worldState.npcStates && Object.keys(snapshot.worldState.npcStates).length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">NPC Positions:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(snapshot.worldState.npcStates).map(([name, pos]) => (
                          <Badge key={name} variant="secondary" className="text-xs">
                            {name}: {pos}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Character Stats:</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {snapshot.characters.map((char) => (
                        <div key={char.name} className="text-xs bg-background/50 rounded p-1">
                          <span className="font-medium">{char.name}</span>
                          {char.status && (
                            <span className="text-muted-foreground ml-1">
                              A:{(char.status as any).arousal || 0} C:{(char.status as any).climax || 0}% Comp:{(char.status as any).composure || 100}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {snapshot.recentNarration.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Recent Narration:</span>
                      <div className="text-xs text-muted-foreground/80 italic mt-1 max-h-20 overflow-hidden">
                        {snapshot.recentNarration[snapshot.recentNarration.length - 1]}...
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
