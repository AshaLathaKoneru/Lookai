import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { MobileNav } from "@/components/MobileNav";
import { Calendar, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Log() {
  const { data: meals = [] } = useQuery({
    queryKey: ["meals", "all"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .order("meal_date", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Group meals by date
  const mealsByDate = meals.reduce((acc, meal) => {
    const date = meal.meal_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto p-4 max-w-md">
        {/* Header */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 pt-8"
        >
          <h1 className="text-2xl font-bold mb-1">Meal Log</h1>
          <p className="text-muted-foreground text-sm">Your nutrition history</p>
        </motion.div>

        {meals.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="soft-card p-8 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="font-medium mb-2">No meals logged yet</p>
            <p className="text-sm text-muted-foreground">Start scanning meals to build your history</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {Object.entries(mealsByDate).map(([date, dateMeals], dateIndex) => {
              const totalCalories = dateMeals.reduce((sum, meal) => sum + meal.calories, 0);
              
              return (
                <motion.div 
                  key={date}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: dateIndex * 0.1 }}
                >
                  {/* Date Header */}
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="font-semibold text-sm">
                      {format(parseISO(date), "EEEE, MMM d")}
                    </h2>
                    <span className="text-sm text-muted-foreground">{totalCalories} cal</span>
                  </div>

                  {/* Meal Cards */}
                  <div className="space-y-3">
                    {dateMeals.map((meal, i) => (
                      <motion.div 
                        key={meal.id} 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: dateIndex * 0.1 + i * 0.05 }}
                        className="soft-card p-4 pressable"
                      >
                        <div className="flex items-center gap-4">
                          {/* Food Image */}
                          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                            🍽️
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate mb-2">{meal.name}</h3>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-macro-carbs" />
                                {Number(meal.carbs).toFixed(0)}g
                              </span>
                              <span className="flex items-center gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-macro-protein" />
                                {Number(meal.protein).toFixed(0)}g
                              </span>
                              <span className="flex items-center gap-1 text-xs">
                                <span className="w-2 h-2 rounded-full bg-macro-fat" />
                                {Number(meal.fats).toFixed(0)}g
                              </span>
                            </div>
                          </div>

                          {/* Calories & Arrow */}
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-lg font-bold">{meal.calories}</span>
                              <span className="text-xs text-muted-foreground ml-1">cal</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
