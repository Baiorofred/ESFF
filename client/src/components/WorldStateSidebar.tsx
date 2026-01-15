import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusDisplay } from "@/components/StatusDisplay";
import { NPCDebugDialog } from "@/components/NPCDebugDialog";
import { DebugHistoryDialog } from "@/components/DebugHistoryDialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MapPin,
  Clock,
  Users,
  Scroll,
  ChevronDown,
  ChevronRight,
  Heart,
  Swords,
  Shield,
  Sparkles,
  User,
  Crown,
  Eye,
  EyeOff,
  Info,
  History,
} from "lucide-react";
import type { GameWorld, Character, StoryEntry, CharacterStatus } from "@shared/schema";

interface WorldStateSidebarProps {
  world: GameWorld | null;
  characters: Character[];
  storyEntries: StoryEntry[];
  activePlayerId?: string;
  onCharacterSelect?: (character: Character) => void;
  playerStatus?: CharacterStatus | null;
}

export function WorldStateSidebar({
  world,
  characters,
  storyEntries,
  activePlayerId,
  onCharacterSelect,
  playerStatus,
}: WorldStateSidebarProps) {
  const [worldStateOpen, setWorldStateOpen] = useState(true);
  const [charactersOpen, setCharactersOpen] = useState(true);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [cheatModeOpen, setCheatModeOpen] = useState(false);
  const [debugNpcId, setDebugNpcId] = useState<number | null>(null);
  const [debugHistoryOpen, setDebugHistoryOpen] = useState(false);

  const playerCharacters = characters.filter(c => !c.isNpc && c.isActive);
  const activeNpcs = characters.filter(c => c.isNpc && c.isActive);

  const chapterMarkers = storyEntries
    .filter(e => e.chapterMarker)
    .slice(-5)
    .reverse();

  if (!world) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <Scroll className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No world selected</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div className="space-y-1">
          <h2 className="font-semibold text-lg" data-testid="text-world-name">{world.name}</h2>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="text-xs">
              {world.genre}
            </Badge>
            {world.themes?.slice(0, 2).map((theme, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {theme}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {playerStatus && playerCharacters[0] && (
          <StatusDisplay 
            status={playerStatus} 
            characterName={playerCharacters[0].name} 
          />
        )}

        {activeNpcs.length > 0 && (
          <Collapsible open={cheatModeOpen} onOpenChange={setCheatModeOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between p-2 h-auto text-muted-foreground hover:text-foreground"
                data-testid="button-cheat-mode"
              >
                <span className="flex items-center gap-2 text-xs">
                  {cheatModeOpen ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  NPC Status (Cheat)
                </span>
                {cheatModeOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 pt-2">
              {activeNpcs.map((npc) => {
                const npcStatus = npc.status as CharacterStatus | null;
                const worldState = (world?.worldState || {}) as Record<string, unknown>;
                const npcStates = (worldState.npcStates || {}) as Record<string, string>;
                const npcClothing = (worldState.npcClothing || {}) as Record<string, string>;
                
                return (
                  <div 
                    key={npc.id} 
                    className="border rounded-md p-2 bg-muted/30 cursor-pointer hover-elevate" 
                    data-testid={`npc-status-${npc.id}`}
                    onClick={() => setDebugNpcId(npc.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{npc.name}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {npc.sexualPersonality || 'switch'}
                        </Badge>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                    {npcStatus && (
                      <StatusDisplay 
                        status={npcStatus} 
                        characterName="" 
                      />
                    )}
                    <div className="mt-2 text-xs text-muted-foreground space-y-1">
                      <div><span className="text-muted-foreground/70">Position:</span> {npcStates[npc.name] || 'unknown'}</div>
                      <div><span className="text-muted-foreground/70">Wearing:</span> {npcClothing[npc.name] || 'as described'}</div>
                    </div>
                  </div>
                );
              })}
              {activeNpcs.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No NPCs in scene
                </p>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => setDebugHistoryOpen(true)}
                data-testid="button-debug-history"
              >
                <History className="h-3 w-3 mr-1" />
                View Debug History
              </Button>
            </CollapsibleContent>
          </Collapsible>
        )}

        <Separator />

        <Collapsible open={worldStateOpen} onOpenChange={setWorldStateOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium text-sm">World State</span>
              {worldStateOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <Card className="bg-muted/30">
              <CardContent className="p-3 space-y-3">
                {world.currentLocation && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Location</div>
                      <div className="text-sm font-medium" data-testid="text-current-location">
                        {world.currentLocation}
                      </div>
                    </div>
                  </div>
                )}
                {world.currentTime && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide">Time</div>
                      <div className="text-sm font-medium" data-testid="text-current-time">
                        {world.currentTime}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {activeNpcs.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Present NPCs
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeNpcs.slice(0, 4).map((npc) => (
                    <Badge 
                      key={npc.id} 
                      variant="outline" 
                      className="cursor-pointer hover-elevate"
                      onClick={() => onCharacterSelect?.(npc)}
                      data-testid={`badge-npc-${npc.id}`}
                    >
                      {npc.name}
                    </Badge>
                  ))}
                  {activeNpcs.length > 4 && (
                    <Badge variant="secondary">+{activeNpcs.length - 4}</Badge>
                  )}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={charactersOpen} onOpenChange={setCharactersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium text-sm">Player Characters</span>
              {charactersOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            {playerCharacters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No characters yet
              </p>
            ) : (
              playerCharacters.map((char) => (
                <Card 
                  key={char.id} 
                  className={`cursor-pointer hover-elevate ${
                    char.ownerId === activePlayerId ? "border-primary/50" : ""
                  }`}
                  onClick={() => onCharacterSelect?.(char)}
                  data-testid={`card-character-${char.id}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/20">
                          {char.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {char.name}
                          </span>
                          {char.ownerId === activePlayerId && (
                            <Crown className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {char.description}
                        </p>
                        {char.stats && Object.keys(char.stats).length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {char.stats.health !== undefined && (
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-red-500" />
                                <span className="text-xs">{char.stats.health}</span>
                              </div>
                            )}
                            {char.stats.strength !== undefined && (
                              <div className="flex items-center gap-1">
                                <Swords className="h-3 w-3 text-orange-500" />
                                <span className="text-xs">{char.stats.strength}</span>
                              </div>
                            )}
                            {char.stats.magic !== undefined && (
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-purple-500" />
                                <span className="text-xs">{char.stats.magic}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        <Collapsible open={timelineOpen} onOpenChange={setTimelineOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-2 h-auto">
              <span className="font-medium text-sm">Timeline</span>
              {timelineOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            {chapterMarkers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No chapters yet
              </p>
            ) : (
              <div className="space-y-2">
                {chapterMarkers.map((entry, idx) => (
                  <div 
                    key={entry.id}
                    className="flex items-center gap-2 text-sm p-2 rounded hover-elevate cursor-pointer"
                    data-testid={`timeline-entry-${entry.id}`}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="truncate">{entry.chapterMarker}</span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      <NPCDebugDialog 
        npcId={debugNpcId}
        open={debugNpcId !== null}
        onClose={() => setDebugNpcId(null)}
      />
      
      <DebugHistoryDialog
        worldId={world.id}
        open={debugHistoryOpen}
        onClose={() => setDebugHistoryOpen(false)}
      />
    </ScrollArea>
  );
}
