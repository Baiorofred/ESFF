import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterCreateForm } from "@/components/CharacterCreateForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Play, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameWorld, Character, InsertCharacter } from "@shared/schema";

export default function GameSetup() {
  const params = useParams<{ id: string }>();
  const worldId = parseInt(params.id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: world, isLoading: worldLoading } = useQuery<GameWorld>({
    queryKey: ["/api/worlds", worldId],
    enabled: !!worldId,
  });

  const { data: characters, isLoading: charsLoading } = useQuery<Character[]>({
    queryKey: ["/api/worlds", worldId, "characters"],
    enabled: !!worldId,
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: Omit<InsertCharacter, "worldId">) => {
      const response = await apiRequest("POST", `/api/worlds/${worldId}/characters`, {
        ...data,
        worldId,
        isNpc: false,
        isActive: true,
        stats: {
          health: data.health || 100,
          strength: data.strength || 50,
          magic: data.magic || 50,
          agility: data.agility || 50,
        },
      });
      return response.json();
    },
    onSuccess: (character) => {
      queryClient.invalidateQueries({ queryKey: ["/api/worlds", worldId, "characters"] });
      toast({
        title: "Character Created",
        description: `${character.name} is ready for adventure!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create character",
        variant: "destructive",
      });
    },
  });

  const handleCharacterSubmit = (data: any) => {
    createCharacterMutation.mutate(data);
  };

  const playerCharacters = characters?.filter(c => !c.isNpc) || [];
  const canStartGame = playerCharacters.length >= 1;

  if (worldLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  if (!world) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">World not found</p>
            <Button onClick={() => navigate("/")} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-world-name">
            {world.name}
          </h1>
          <p className="text-muted-foreground">{world.description}</p>
        </div>

        {playerCharacters.length > 0 && (
          <Card className="max-w-2xl mx-auto mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Active Characters
              </CardTitle>
              <CardDescription>
                Characters ready to enter {world.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {playerCharacters.map((char) => (
                  <div 
                    key={char.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    data-testid={`character-ready-${char.id}`}
                  >
                    <div>
                      <p className="font-medium">{char.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {char.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {canStartGame && (
                <Button 
                  className="w-full mt-4" 
                  onClick={() => navigate(`/game/${worldId}`)}
                  data-testid="button-start-game"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Adventure
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <CharacterCreateForm 
          onSubmit={handleCharacterSubmit}
          isLoading={createCharacterMutation.isPending}
          worldName={world.name}
        />
      </main>
    </div>
  );
}
