import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("meals")
        .insert({
          user_id: user.id,
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          carbs: meal.carbs,
          fats: meal.fats,
          meal_date: new Date().toISOString().split('T')[0],
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <div className="container mx-auto max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Review Meal</h1>
          <p className="text-muted-foreground">Adjust the details if needed</p>
        </div>

        <Card className="p-4 mb-4">
          {image && (
            <img
              src={image}
              alt="Meal"
              className="w-full rounded-lg mb-4"
            />
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Meal Name</Label>
              <Input
                id="name"
                value={meal.name}
                onChange={(e) => setMeal({ ...meal, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="calories">Calories (kcal)</Label>
              <Input
                id="calories"
                type="number"
                value={meal.calories}
                onChange={(e) => setMeal({ ...meal, calories: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={meal.protein}
                  onChange={(e) => setMeal({ ...meal, protein: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={meal.carbs}
                  onChange={(e) => setMeal({ ...meal, carbs: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  value={meal.fats}
                  onChange={(e) => setMeal({ ...meal, fats: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/scan")}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => logMealMutation.mutate()}
            disabled={logMealMutation.isPending}
            className="flex-1"
          >
            {logMealMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log Meal"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}