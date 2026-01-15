import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, BookOpen, Play, Trash2 } from "lucide-react";
import type { GameWorld } from "@shared/schema";

interface WorldCardProps {
  world: GameWorld;
  onPlay: (world: GameWorld) => void;
  onDelete?: (world: GameWorld) => void;
  playerCount?: number;
  entryCount?: number;
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WorldCard({ world, onPlay, onDelete, playerCount = 0, entryCount = 0 }: WorldCardProps) {
  return (
    <Card className="hover-elevate cursor-pointer group" data-testid={`card-world-${world.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate" data-testid={`text-world-title-${world.id}`}>
              {world.name}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="secondary" className="text-xs">
                {world.genre}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {world.description}
        </p>
        
        {world.themes && world.themes.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {world.themes.slice(0, 3).map((theme, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {theme}
              </Badge>
            ))}
            {world.themes.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{world.themes.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(world.createdAt)}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {entryCount} entries
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(world);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-delete-world-${world.id}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(world);
            }}
            data-testid={`button-play-world-${world.id}`}
          >
            <Play className="h-4 w-4 mr-2" />
            Play
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
