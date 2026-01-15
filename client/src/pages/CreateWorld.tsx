import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { WorldSetupForm } from "@/components/WorldSetupForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertGameWorld } from "@shared/schema";

export default function CreateWorld() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: InsertGameWorld) => {
      const response = await apiRequest("POST", "/api/worlds", data);
      return response.json();
    },
    onSuccess: (world) => {
      queryClient.invalidateQueries({ queryKey: ["/api/worlds"] });
      toast({
        title: "World Created",
        description: `${world.name} has been created. Now create a character to begin!`,
      });
      navigate(`/game/${world.id}/setup`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create world",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: InsertGameWorld) => {
    createMutation.mutate(data);
  };

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
        <WorldSetupForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
      </main>
    </div>
  );
}
