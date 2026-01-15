import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WorldCard } from "@/components/WorldCard";
import { Plus, Scroll, Sparkles } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { GameWorld } from "@shared/schema";

export default function Home() {
  const [, navigate] = useLocation();
  const [worldToDelete, setWorldToDelete] = useState<GameWorld | null>(null);

  const { data: worlds, isLoading } = useQuery<GameWorld[]>({
    queryKey: ["/api/worlds"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/worlds/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worlds"] });
      setWorldToDelete(null);
    },
  });

  const handlePlay = (world: GameWorld) => {
    navigate(`/game/${world.id}`);
  };

  const handleDelete = (world: GameWorld) => {
    setWorldToDelete(world);
  };

  const confirmDelete = () => {
    if (worldToDelete) {
      deleteMutation.mutate(worldToDelete.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scroll className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold">
              Chronicle
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Collaborative fiction universes powered by AI. Create worlds, craft characters, and let your stories unfold.
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Worlds</h2>
          <Button onClick={() => navigate("/create-world")} data-testid="button-create-world">
            <Plus className="h-4 w-4 mr-2" />
            New World
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/4 mb-4" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : worlds && worlds.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {worlds.map((world) => (
              <WorldCard
                key={world.id}
                world={world}
                onPlay={handlePlay}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed" data-testid="card-empty-state">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No worlds yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create your first fictional universe and begin your collaborative storytelling adventure.
              </p>
              <Button onClick={() => navigate("/create-world")} data-testid="button-create-first-world">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First World
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!worldToDelete} onOpenChange={() => setWorldToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete World</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{worldToDelete?.name}"? This will permanently remove all story entries, characters, and sessions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
