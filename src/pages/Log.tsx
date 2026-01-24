import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { MobileNav } from "@/components/MobileNav";
import { Calendar, Flame } from "lucide-react";

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
    <div className="min-h-screen bg-background pb-32 relative">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]" />
      
      <div className="container mx-auto p-4 max-w-2xl relative z-10">
        {/* Header */}
        <div className="mb-6 pt-8">
          <h1 className="text-2xl font-bold mb-1">Meal Log</h1>
          <p className="text-muted-foreground text-sm">Your nutrition history</p>
        </div>

        {meals.length === 0 ? (
          <div className="trading-card rounded-[28px] p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Calendar className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium mb-2">No meals logged yet</p>
            <p className="text-sm text-muted-foreground">Start scanning meals to build your history</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(mealsByDate).map(([date, dateMeals]) => {
              const totalCalories = dateMeals.reduce((sum, meal) => sum + meal.calories, 0);
              
              return (
                <div key={date}>
                  {/* Date Header */}
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h2 className="font-semibold text-sm">
                      {format(parseISO(date), "EEEE, MMM d")}
                    </h2>
                    <div className="chip px-2 py-1 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium">{totalCalories} kcal</span>
                    </div>
                  </div>

                  {/* Meal Cards */}
                  <div className="space-y-3">
                    {dateMeals.map((meal) => (
                      <div 
                        key={meal.id} 
                        className="trading-card rounded-[20px] p-4 pressable"
                      >
                        <div className="flex items-start justify-between gap-4">
                          {/* Left: Meal Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{meal.name}</h3>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-2xl font-bold neon-text">{meal.calories}</span>
                              <span className="text-sm text-muted-foreground">kcal</span>
                            </div>
                          </div>

                          {/* Right: Vertical Macro Display */}
                          <div className="flex gap-3">
                            {/* Protein */}
                            <div className="text-center">
                              <div className="w-12 h-16 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-primary">
                                  {Number(meal.protein).toFixed(0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">g</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 block">PRO</span>
                            </div>

                            {/* Carbs */}
                            <div className="text-center">
                              <div className="w-12 h-16 rounded-xl bg-info/10 border border-info/20 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-info">
                                  {Number(meal.carbs).toFixed(0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">g</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 block">CARB</span>
                            </div>

                            {/* Fats */}
                            <div className="text-center">
                              <div className="w-12 h-16 rounded-xl bg-warning/10 border border-warning/20 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold text-warning">
                                  {Number(meal.fats).toFixed(0)}
                                </span>
                                <span className="text-[10px] text-muted-foreground">g</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1 block">FAT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}
