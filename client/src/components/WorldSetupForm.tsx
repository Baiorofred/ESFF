import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";

const worldSchema = z.object({
  name: z.string().min(1, "World name is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  genre: z.string().min(1, "Genre is required"),
  setting: z.string().min(10, "Setting must be at least 10 characters").max(2000),
  rules: z.string().min(10, "Rules must be at least 10 characters").max(5000),
  themes: z.array(z.string()).default([]),
  currentLocation: z.string().optional(),
  currentTime: z.string().optional(),
});

type WorldFormData = z.infer<typeof worldSchema>;

interface WorldSetupFormProps {
  onSubmit: (data: WorldFormData) => void;
  isLoading?: boolean;
  initialData?: Partial<WorldFormData>;
}

const GENRES = [
  "Fantasy",
  "Sci-Fi",
  "Horror",
  "Romance",
  "Noir",
  "Post-Apocalyptic",
  "Urban Fantasy",
  "Historical",
  "Cyberpunk",
  "Supernatural",
  "Slice of Life",
  "Adventure",
];

const THEME_SUGGESTIONS = [
  "Adult",
  "Erotic",
  "Dark",
  "Mature",
  "Violent",
  "Romantic",
  "Political",
  "Mystery",
  "Survival",
  "Redemption",
  "Power",
  "Betrayal",
  "Forbidden",
  "Psychological",
];

export function WorldSetupForm({ onSubmit, isLoading, initialData }: WorldSetupFormProps) {
  const [themeInput, setThemeInput] = useState("");

  const form = useForm<WorldFormData>({
    resolver: zodResolver(worldSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      genre: initialData?.genre || "",
      setting: initialData?.setting || "",
      rules: initialData?.rules || "",
      themes: initialData?.themes || [],
      currentLocation: initialData?.currentLocation || "",
      currentTime: initialData?.currentTime || "",
    },
  });

  const themes = form.watch("themes");

  const addTheme = (theme: string) => {
    const trimmed = theme.trim();
    if (trimmed && !themes.includes(trimmed)) {
      form.setValue("themes", [...themes, trimmed]);
    }
    setThemeInput("");
  };

  const removeTheme = (theme: string) => {
    form.setValue("themes", themes.filter(t => t !== theme));
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Create Your Universe
        </CardTitle>
        <CardDescription>
          Define the world where your story will unfold. The AI will use these details to create immersive narratives.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>World Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="The Crimson Dominion" 
                      {...field} 
                      data-testid="input-world-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Genre</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-genre">
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENRES.map((genre) => (
                        <SelectItem key={genre} value={genre.toLowerCase()}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>World Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="A dark and sensual realm where power, desire, and magic intertwine..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="input-world-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the overall atmosphere, tone, and nature of your world.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setting"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setting Details</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the geography, cultures, factions, notable locations, and any unique elements of your world..."
                      className="min-h-[120px]"
                      {...field}
                      data-testid="input-world-setting"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>World Rules & Boundaries</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define the rules of magic, technology, social norms, and any content guidelines or themes you want the AI to embrace or avoid..."
                      className="min-h-[150px]"
                      {...field}
                      data-testid="input-world-rules"
                    />
                  </FormControl>
                  <FormDescription>
                    These rules guide the AI narrator. Be explicit about what you want included or excluded.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="themes"
              render={() => (
                <FormItem>
                  <FormLabel>Themes & Tags</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a theme..."
                        value={themeInput}
                        onChange={(e) => setThemeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTheme(themeInput);
                          }
                        }}
                        data-testid="input-theme"
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => addTheme(themeInput)}
                        data-testid="button-add-theme"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {THEME_SUGGESTIONS.filter(t => !themes.includes(t)).slice(0, 8).map((theme) => (
                        <Badge
                          key={theme}
                          variant="outline"
                          className="cursor-pointer hover-elevate"
                          onClick={() => addTheme(theme)}
                          data-testid={`badge-theme-suggestion-${theme.toLowerCase()}`}
                        >
                          + {theme}
                        </Badge>
                      ))}
                    </div>

                    {themes.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {themes.map((theme) => (
                          <Badge key={theme} variant="secondary" className="gap-1">
                            {theme}
                            <button
                              type="button"
                              onClick={() => removeTheme(theme)}
                              className="ml-1 hover:text-destructive"
                              data-testid={`button-remove-theme-${theme.toLowerCase()}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="The Velvet Throne Room" 
                        {...field} 
                        data-testid="input-starting-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting Time</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Midnight, Year 847 of the Eclipse" 
                        {...field}
                        data-testid="input-starting-time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-create-world"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating World...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create World
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
