import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, addDays } from "date-fns";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealPlan {
  id: string;
  plan_date: string;
  meal_type: MealType;
  recipe_name: string;
  recipe_image: string | null;
  calories: number | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  notes: string | null;
}

export function useMealPlans(weekStart?: Date) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const start = weekStart || startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = addDays(start, 6);

  const { data: mealPlans = [], isLoading } = useQuery({
    queryKey: ["meal-plans", format(start, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .gte("plan_date", format(start, "yyyy-MM-dd"))
        .lte("plan_date", format(end, "yyyy-MM-dd"))
        .order("plan_date", { ascending: true });

      if (error) throw error;
      return data as MealPlan[];
    },
  });

  const addMealPlan = useMutation({
    mutationFn: async (plan: {
      date: Date;
      mealType: MealType;
      recipeName: string;
      recipeImage?: string;
      calories?: number;
      protein?: string;
      carbs?: string;
      fat?: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("meal_plans").insert({
        user_id: user.id,
        plan_date: format(plan.date, "yyyy-MM-dd"),
        meal_type: plan.mealType,
        recipe_name: plan.recipeName,
        recipe_image: plan.recipeImage,
        calories: plan.calories,
        protein: plan.protein,
        carbs: plan.carbs,
        fat: plan.fat,
        notes: plan.notes,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
      toast({ title: "Meal planned!", description: "Added to your calendar" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add meal plan", variant: "destructive" });
    },
  });

  const removeMealPlan = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meal_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meal-plans"] });
      toast({ title: "Removed", description: "Meal removed from plan" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove meal", variant: "destructive" });
    },
  });

  const getMealsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return mealPlans.filter(mp => mp.plan_date === dateStr);
  };

  const getMealsForDayAndType = (date: Date, mealType: MealType) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return mealPlans.filter(mp => mp.plan_date === dateStr && mp.meal_type === mealType);
  };

  return {
    mealPlans,
    isLoading,
    addMealPlan,
    removeMealPlan,
    getMealsForDay,
    getMealsForDayAndType,
  };
}
