import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Check, Plus, Flame, Info } from "lucide-react";

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

  // Daily targets for macro progress bars
  const targets = { protein: 45, carbs: 150, fats: 65 };

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

  // Calculate calorie intensity label
  const getIntensityLabel = (cal: number) => {
    if (cal < 200) return "Light";
    if (cal < 400) return "Moderate";
    return "Heavy";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
        <button
          onClick={() => navigate("/scan")}
          className="w-12 h-12 rounded-full border border-border/50 bg-background/60 backdrop-blur-md flex items-center justify-center pressable"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">
          SCAN PREVIEW
        </span>
        <button className="w-12 h-12 rounded-full border border-border/50 bg-background/60 backdrop-blur-md flex items-center justify-center pressable">
          <Pencil className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Image section */}
      <div className="relative flex-shrink-0">
        {image && (
          <img
            src={image}
            alt="Meal"
            className="w-full h-[55vh] object-cover"
            loading="lazy"
          />
        )}
        {/* Gradient fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

        {/* 98% Match pill */}
        <div className="absolute top-28 right-4 chip flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold">
          <Check className="w-4 h-4 text-primary" />
          <span>98% MATCH</span>
        </div>

        {/* Food name chip - bottom left of image */}
        <div className="absolute bottom-6 left-4 flex items-center gap-3">
          <div className="chip flex items-center gap-2 px-4 py-2.5 text-base font-medium">
            <span className="text-primary text-lg">🍔</span>
            <span>{meal.name || "Food Item"}</span>
          </div>
        </div>

        {/* Info button - bottom right of image */}
        <button className="absolute bottom-6 right-4 w-10 h-10 rounded-full border border-border/50 bg-background/60 backdrop-blur-md flex items-center justify-center">
          <Info className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="flex-1 trading-card rounded-t-[28px] -mt-4 relative z-10 px-5 pt-4 pb-32 flex flex-col">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-6" />

        {/* Calorie display */}
        <div className="text-center mb-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-7xl font-bold neon-text tracking-tight">
              {meal.calories}
            </span>
            <span className="text-xl font-medium text-muted-foreground">kcal</span>
          </div>
          {/* Intensity chip */}
          <div className="chip inline-flex items-center gap-1.5 px-3 py-1.5 mt-3">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {getIntensityLabel(meal.calories)}
            </span>
          </div>
        </div>

        {/* Macro bars */}
        <div className="space-y-4 mt-4 flex-1">
          {/* Protein */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">Protein</span>
              <span className="text-sm font-bold text-primary">{meal.protein}g</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((meal.protein / targets.protein) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0g</span>
              <span className="text-xs text-muted-foreground">Target: {targets.protein}g</span>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">Carbs</span>
              <span className="text-sm font-bold text-primary">{meal.carbs}g</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((meal.carbs / targets.carbs) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0g</span>
              <span className="text-xs text-muted-foreground">Target: {targets.carbs}g</span>
            </div>
          </div>

          {/* Fats */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-foreground">Fat</span>
              <span className="text-sm font-bold text-primary">{meal.fats}g</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${Math.min((meal.fats / targets.fats) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">0g</span>
              <span className="text-xs text-muted-foreground">Target: {targets.fats}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom LOG MEAL button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-background via-background to-transparent z-30">
        <Button
          onClick={() => logMealMutation.mutate()}
          disabled={logMealMutation.isPending}
          className="w-full h-14 neon-fab text-base font-bold tracking-wide rounded-full flex items-center justify-center gap-2"
        >
          {logMealMutation.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="shimmer h-4 w-16 rounded-full" />
              Logging...
            </span>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              LOG MEAL
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
