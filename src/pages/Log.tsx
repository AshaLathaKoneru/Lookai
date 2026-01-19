import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { MobileNav } from "@/components/MobileNav";
import { Calendar } from "lucide-react";

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Meal Log</h1>
          <p className="text-muted-foreground">Your nutrition history</p>
        </div>

        {meals.length === 0 ? (
          <Card className="trading-card p-8 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-2">No meals logged yet</p>
            <p className="text-sm text-muted-foreground">Start scanning meals to build your history</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(mealsByDate).map(([date, dateMeals]) => {
              const totalCalories = dateMeals.reduce((sum, meal) => sum + meal.calories, 0);
              
              return (
                <div key={date}>
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="font-semibold">
                      {format(parseISO(date), "EEEE, MMMM d")}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {totalCalories} kcal
                    </span>
                  </div>
                  <div className="space-y-3">
                    {dateMeals.map((meal) => (
                      <Card key={meal.id} className="trading-card p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold mb-1">{meal.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {meal.calories} kcal
                            </p>
                          </div>
                          <div className="text-right text-sm text-muted-foreground">
                            <div>P: {Number(meal.protein).toFixed(0)}g</div>
                            <div>C: {Number(meal.carbs).toFixed(0)}g</div>
                            <div>F: {Number(meal.fats).toFixed(0)}g</div>
                          </div>
                        </div>
                      </Card>
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