import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Heart } from "lucide-react";
import { motion } from "framer-motion";

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
        title: "Meal Logged",
        description: "Added to today's log",
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

  // Calculate health score based on macros balance
  const totalMacros = meal.protein + meal.carbs + meal.fats;
  const healthScore = totalMacros > 0 ? Math.min(95, Math.round((meal.protein / totalMacros) * 100 + 40)) : 75;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-5 pt-14 pb-4 flex items-center justify-between"
      >
        <button
          onClick={() => navigate("/")}
          className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center pressable"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-section">Nutrition Details</h1>
        <button className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center pressable">
          <Heart className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Food Image */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="px-5 py-6 flex justify-center"
      >
        <div className="w-56 h-56 rounded-3xl overflow-hidden bg-secondary">
          {image ? (
            <img
              src={image}
              alt="Meal"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-5 pb-32"
      >
        {/* Food Name & Calories */}
        <div className="text-center mb-8">
          <h2 className="text-display mb-2">{meal.name || "Food Item"}</h2>
          <div className="flex items-center justify-center gap-1">
            <span className="text-2xl text-number">{meal.calories}</span>
            <span className="text-muted-foreground">calories</span>
          </div>
        </div>

        {/* Macro Pills */}
        <div className="flex justify-center gap-3 mb-8">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-macro-protein" />
            <span className="text-sm">
              <span className="font-semibold">{meal.protein}g</span>
              <span className="text-muted-foreground ml-1">Protein</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-macro-carbs" />
            <span className="text-sm">
              <span className="font-semibold">{meal.carbs}g</span>
              <span className="text-muted-foreground ml-1">Carbs</span>
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-secondary">
            <span className="w-2.5 h-2.5 rounded-full bg-macro-fat" />
            <span className="text-sm">
              <span className="font-semibold">{meal.fats}g</span>
              <span className="text-muted-foreground ml-1">Fat</span>
            </span>
          </div>
        </div>

        {/* Health Score */}
        <div className="premium-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Health Score</span>
            <span className="font-bold text-accent">{healthScore}%</span>
          </div>
          <div className="health-bar">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="health-bar-fill"
            />
          </div>
        </div>
      </motion.div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-10 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex gap-3 max-w-md mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/scan")}
            className="flex-1 h-14 rounded-full text-[15px] font-semibold"
          >
            Retake
          </Button>
          <Button
            onClick={() => logMealMutation.mutate()}
            disabled={logMealMutation.isPending}
            className="flex-1 h-14 rounded-full text-[15px] font-semibold"
          >
            {logMealMutation.isPending ? "Adding..." : "Add Food"}
          </Button>
        </div>
      </div>
    </div>
  );
}
