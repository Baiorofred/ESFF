import { Progress } from "@/components/ui/progress";
import { CharacterStatus } from "@shared/schema";
import { Heart, Flame, Brain } from "lucide-react";

interface StatusDisplayProps {
  status: CharacterStatus;
  characterName: string;
}

export function StatusDisplay({ status, characterName }: StatusDisplayProps) {
  const getArousalColor = (value: number) => {
    if (value < 30) return "bg-blue-500";
    if (value < 60) return "bg-pink-500";
    return "bg-red-500";
  };

  const getClimaxColor = (value: number) => {
    if (value < 50) return "bg-orange-400";
    if (value < 80) return "bg-orange-500";
    return "bg-red-600";
  };

  return (
    <div className="p-3 space-y-3 border-b" data-testid="status-display">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {characterName}'s Status
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-pink-500" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span>Arousal</span>
              <span className={`font-medium ${status.arousal >= 100 ? 'text-red-500' : status.arousal >= 50 ? 'text-pink-500' : 'text-muted-foreground'}`}>
                {status.arousal}
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getArousalColor(status.arousal)}`}
                style={{ width: `${Math.min(status.arousal, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span>Climax</span>
              <span>{status.climax}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${getClimaxColor(status.climax)}`}
                style={{ width: `${status.climax}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-purple-500" />
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span>Composure</span>
              <span>{status.composure}%</span>
            </div>
            <Progress value={status.composure} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
