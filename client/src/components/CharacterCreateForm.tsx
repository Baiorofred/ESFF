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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { X, Plus, User, Loader2 } from "lucide-react";
import { useState } from "react";

const sexualPersonalityOptions = [
  { value: 'dominant', label: 'Dominant', description: 'Takes control when composure breaks. Becomes primal and demanding.' },
  { value: 'submissive', label: 'Submissive', description: 'Surrenders when composure breaks. Gives up all agency to partner.' },
  { value: 'switch', label: 'Switch', description: 'Adapts based on context and partner. Can go either way.' },
] as const;

const characterSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  personality: z.string().max(1000).optional(),
  background: z.string().max(2000).optional(),
  sexualPersonality: z.enum(['dominant', 'submissive', 'switch']).default('switch'),
  health: z.number().min(0).max(100).default(100),
  strength: z.number().min(0).max(100).default(50),
  magic: z.number().min(0).max(100).default(50),
  agility: z.number().min(0).max(100).default(50),
  inventory: z.array(z.string()).default([]),
});

type CharacterFormData = z.infer<typeof characterSchema>;

interface CharacterCreateFormProps {
  onSubmit: (data: CharacterFormData) => void;
  isLoading?: boolean;
  worldName?: string;
}

export function CharacterCreateForm({ onSubmit, isLoading, worldName }: CharacterCreateFormProps) {
  const [inventoryInput, setInventoryInput] = useState("");

  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: "",
      description: "",
      personality: "",
      background: "",
      sexualPersonality: "switch",
      health: 100,
      strength: 50,
      magic: 50,
      agility: 50,
      inventory: [],
    },
  });

  const inventory = form.watch("inventory");

  const addItem = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !inventory.includes(trimmed)) {
      form.setValue("inventory", [...inventory, trimmed]);
    }
    setInventoryInput("");
  };

  const removeItem = (item: string) => {
    form.setValue("inventory", inventory.filter(i => i !== item));
  };

  const handleSubmit = (data: CharacterFormData) => {
    onSubmit({
      ...data,
      inventory: data.inventory,
    });
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Create Your Character
        </CardTitle>
        <CardDescription>
          {worldName ? `Create a character for ${worldName}` : "Define your character's identity and attributes"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Character Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Seraphina Nightshade" 
                      {...field} 
                      data-testid="input-character-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Physical Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your character's appearance, distinguishing features, and typical attire..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="input-character-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personality</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How does your character behave? What are their quirks, desires, and fears?"
                      className="min-h-[80px]"
                      {...field}
                      data-testid="input-character-personality"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is your character's history? Past relationships, traumas, achievements?"
                      className="min-h-[100px]"
                      {...field}
                      data-testid="input-character-background"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sexualPersonality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexual Personality</FormLabel>
                  <FormDescription>
                    Determines behavior when composure reaches zero
                  </FormDescription>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                      data-testid="radio-sexual-personality"
                    >
                      {sexualPersonalityOptions.map((option) => (
                        <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border hover-elevate cursor-pointer">
                          <RadioGroupItem 
                            value={option.value} 
                            id={option.value} 
                            className="mt-1" 
                            data-testid={`radio-sexual-personality-${option.value}`}
                          />
                          <div className="flex-1">
                            <Label htmlFor={option.value} className="font-medium cursor-pointer">
                              {option.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="font-medium">Attributes</h3>
              
              <FormField
                control={form.control}
                name="health"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Health</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v)}
                        max={100}
                        step={5}
                        data-testid="slider-health"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strength"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Strength</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v)}
                        max={100}
                        step={5}
                        data-testid="slider-strength"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="magic"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Magic</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v)}
                        max={100}
                        step={5}
                        data-testid="slider-magic"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agility"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between">
                      <FormLabel>Agility</FormLabel>
                      <span className="text-sm text-muted-foreground">{field.value}</span>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v)}
                        max={100}
                        step={5}
                        data-testid="slider-agility"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inventory"
              render={() => (
                <FormItem>
                  <FormLabel>Starting Inventory</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an item..."
                        value={inventoryInput}
                        onChange={(e) => setInventoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItem(inventoryInput);
                          }
                        }}
                        data-testid="input-inventory-item"
                      />
                      <Button 
                        type="button" 
                        variant="secondary" 
                        onClick={() => addItem(inventoryInput)}
                        data-testid="button-add-item"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {inventory.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {inventory.map((item) => (
                          <Badge key={item} variant="secondary" className="gap-1">
                            {item}
                            <button
                              type="button"
                              onClick={() => removeItem(item)}
                              className="ml-1 hover:text-destructive"
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
              data-testid="button-create-character"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Character...
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Create Character
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
