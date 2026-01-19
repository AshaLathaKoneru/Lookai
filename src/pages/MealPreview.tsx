import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function MealPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mealData, image } = location.state || {};

  const [meal, setMeal] = useState({
    name: mealData?.name || "",
    calories: mealData?.calories || 0,
    protein: mealData?.protein || 0,
    carbs: mealData?.carbs || 0,
    fats: mealData?.fats || 0,
  });

  const logMealMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("meals").insert({
        user_id: user.id,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fats: meal.fats,
        meal_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Meal Logged!",
        description: "Your meal has been added to today's log",
      });
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!mealData) {
    navigate("/scan");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-32 relative overflow-hidden">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />

      <div className="container mx-auto max-w-md relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Scan Preview</h1>
          <p className="text-muted-foreground">Review & tweak before logging</p>
        </div>

        <Card className="trading-card p-4 mb-4 rounded-[32px]">
          {image && (
            <div className="relative overflow-hidden rounded-[22px]">
              <img
                src={image}
                alt="Meal"
                className="w-full h-[46vh] object-cover"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
            </div>
          )}

          <div className="space-y-4 mt-4">
            <div className="flex items-baseline justify-between">
              <div className="text-sm text-muted-foreground tracking-[0.2em]">TOTAL</div>
              <div className="text-4xl font-bold neon-text">
                {meal.calories}
                <span className="text-base font-semibold text-muted-foreground ml-1">kcal</span>
              </div>
            </div>

            <div>
              <Label htmlFor="name">Item</Label>
              <Input
                id="name"
                value={meal.name}
                onChange={(e) => setMeal({ ...meal, name: e.target.value })}
                className="glass-panel"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={meal.calories}
                  onChange={(e) =>
                    setMeal({ ...meal, calories: parseInt(e.target.value) || 0 })
                  }
                  className="glass-panel"
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={meal.protein}
                  onChange={(e) =>
                    setMeal({ ...meal, protein: parseFloat(e.target.value) || 0 })
                  }
                  className="glass-panel"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={meal.carbs}
                  onChange={(e) =>
                    setMeal({ ...meal, carbs: parseFloat(e.target.value) || 0 })
                  }
                  className="glass-panel"
                />
              </div>
              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  value={meal.fats}
                  onChange={(e) =>
                    setMeal({ ...meal, fats: parseFloat(e.target.value) || 0 })
                  }
                  className="glass-panel"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/scan")}
            className="flex-1 glass-panel"
            disabled={logMealMutation.isPending}
          >
            Back
          </Button>
          <Button
            onClick={() => logMealMutation.mutate()}
            disabled={logMealMutation.isPending}
            className="flex-1 neon-fab"
          >
            {logMealMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="shimmer h-4 w-16 rounded-full" />
                Logging
              </span>
            ) : (
              "LOG MEAL"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
