import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Player {
  id: string;
  name: string;
  isOnline: boolean;
  characterName?: string;
}

interface PresenceIndicatorProps {
  players: Player[];
  currentPlayerId?: string;
}

export function PresenceIndicator({ players, currentPlayerId }: PresenceIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {players.map((player) => (
        <Tooltip key={player.id}>
          <TooltipTrigger asChild>
            <div className="relative">
              <Avatar 
                className={`h-8 w-8 ${player.id === currentPlayerId ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
                data-testid={`avatar-player-${player.id}`}
              >
                <AvatarFallback className="text-xs bg-primary/20">
                  {player.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span 
                className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
                  player.isOnline ? "bg-status-online" : "bg-status-offline"
                }`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{player.name}</p>
            {player.characterName && (
              <p className="text-xs text-muted-foreground">Playing as {player.characterName}</p>
            )}
            <p className="text-xs mt-1">
              {player.isOnline ? "Online" : "Offline"}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
      
      {players.length === 0 && (
        <Badge variant="outline" className="text-muted-foreground">
          Waiting for players...
        </Badge>
      )}
    </div>
  );
}
