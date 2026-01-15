import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Heart,
  Swords,
  Shield,
  Sparkles,
  Brain,
  Zap,
  Package,
  Users,
  Edit,
  X,
} from "lucide-react";
import type { Character } from "@shared/schema";

interface CharacterSheetProps {
  character: Character | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (character: Character) => void;
}

const STAT_ICONS: Record<string, React.ReactNode> = {
  health: <Heart className="h-4 w-4 text-red-500" />,
  strength: <Swords className="h-4 w-4 text-orange-500" />,
  defense: <Shield className="h-4 w-4 text-blue-500" />,
  magic: <Sparkles className="h-4 w-4 text-purple-500" />,
  intelligence: <Brain className="h-4 w-4 text-cyan-500" />,
  agility: <Zap className="h-4 w-4 text-yellow-500" />,
};

function StatBar({ name, value, max = 100 }: { name: string; value: number; max?: number }) {
  const icon = STAT_ICONS[name.toLowerCase()] || <Sparkles className="h-4 w-4" />;
  const percentage = (value / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon}
          <span className="capitalize">{name}</span>
        </div>
        <span className="text-muted-foreground">{value}/{max}</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

export function CharacterSheet({ character, open, onClose, onEdit }: CharacterSheetProps) {
  if (!character) return null;

  const stats = character.stats || {};
  const inventory = character.inventory || [];
  const relationships = character.relationships || {};

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-2xl bg-primary/20">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl" data-testid="text-character-name">
                  {character.name}
                </DialogTitle>
                <div className="flex gap-2 mt-1">
                  <Badge variant={character.isNpc ? "secondary" : "default"}>
                    {character.isNpc ? "NPC" : "Player Character"}
                  </Badge>
                  {character.isActive ? (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {onEdit && !character.isNpc && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(character)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground" data-testid="text-character-description">
                {character.description}
              </p>
            </div>

            {character.personality && (
              <div>
                <h3 className="font-medium mb-2">Personality</h3>
                <p className="text-muted-foreground">{character.personality}</p>
              </div>
            )}

            {character.background && (
              <div>
                <h3 className="font-medium mb-2">Background</h3>
                <p className="text-muted-foreground">{character.background}</p>
              </div>
            )}

            <Separator />

            {Object.keys(stats).length > 0 && (
              <div>
                <h3 className="font-medium mb-4">Stats</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(stats).map(([key, value]) => (
                    <StatBar key={key} name={key} value={value as number} />
                  ))}
                </div>
              </div>
            )}

            {inventory.length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Inventory
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {inventory.map((item, idx) => (
                    <Card key={idx} className="bg-muted/30">
                      <CardContent className="p-3 text-sm">
                        {item}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(relationships).length > 0 && (
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Relationships
                </h3>
                <div className="space-y-2">
                  {Object.entries(relationships).map(([name, status]) => (
                    <div 
                      key={name} 
                      className="flex items-center justify-between p-2 rounded bg-muted/30"
                    >
                      <span className="font-medium">{name}</span>
                      <Badge variant="outline">{status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
