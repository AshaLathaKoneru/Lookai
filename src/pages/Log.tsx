import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { MobileNav } from "@/components/MobileNav";
import { Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function Log() {
  const { data: meals = [], isLoading } = useQuery({
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
      <div className="px-5 pt-14 max-w-md mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-display mb-1">Meal Log</h1>
          <p className="text-caption">Your nutrition history</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i}>
                <div className="skeleton h-5 w-32 rounded-lg mb-3" />
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div key={j} className="premium-card p-4 flex gap-4">
                      <div className="skeleton w-14 h-14 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-5 w-3/4 rounded-lg" />
                        <div className="skeleton h-4 w-1/2 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : meals.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-section mb-2">No meals logged yet</p>
            <p className="text-caption">Scan your first meal to get started</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(mealsByDate).map(([date, dateMeals], dateIndex) => {
              const totalCalories = dateMeals.reduce((sum, meal) => sum + meal.calories, 0);
              
              return (
                <motion.div 
                  key={date}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: dateIndex * 0.05 }}
                >
                  {/* Date Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-section">
                      {format(parseISO(date), "EEEE, MMM d")}
                    </h2>
                    <span className="text-caption">{totalCalories} cal</span>
                  </div>

                  {/* Meal Cards */}
                  <div className="space-y-3">
                    {dateMeals.map((meal, i) => (
                      <motion.div 
                        key={meal.id} 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: dateIndex * 0.05 + i * 0.03 }}
                        className="premium-card p-4 pressable"
                      >
                        <div className="flex items-center gap-4">
                          {/* Food Image */}
                          <div className="w-14 h-14 rounded-2xl bg-secondary flex-shrink-0 overflow-hidden">
                            {meal.image_url ? (
                              <img 
                                src={meal.image_url} 
                                alt={meal.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.innerHTML = '<span class="flex items-center justify-center w-full h-full text-xl">🍽️</span>';
                                }}
                              />
                            ) : (
                              <span className="flex items-center justify-center w-full h-full text-xl">🍽️</span>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-[15px] truncate mb-1.5">{meal.name}</h3>
                            <div className="flex items-center gap-3">
                              <span className="macro-badge">
                                <span className="macro-dot macro-dot-protein" />
                                {Number(meal.protein).toFixed(0)}g
                              </span>
                              <span className="macro-badge">
                                <span className="macro-dot macro-dot-carbs" />
                                {Number(meal.carbs).toFixed(0)}g
                              </span>
                              <span className="macro-badge">
                                <span className="macro-dot macro-dot-fat" />
                                {Number(meal.fats).toFixed(0)}g
                              </span>
                            </div>
                          </div>

                          {/* Calories */}
                          <div className="text-right">
                            <span className="text-lg text-number">{meal.calories}</span>
                            <span className="text-caption ml-1">cal</span>
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
