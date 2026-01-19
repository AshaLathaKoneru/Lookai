import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

export default function Home() {
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", "today"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .eq("meal_date", today)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  const calorieGoal = profile?.calorie_goal || 2000;
  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + Number(meal.protein), 0);
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + Number(meal.carbs), 0);
  const totalFats = todayMeals.reduce((sum, meal) => sum + Number(meal.fats), 0);
  const calorieProgress = (totalCalories / calorieGoal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Hello, {profile?.name || "there"}!</h1>
          <p className="text-muted-foreground">{format(new Date(), "EEEE, MMMM d")}</p>
        </div>

        {/* Calorie Ring */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-card to-primary/5">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="12"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 88}`}
                  strokeDashoffset={`${2 * Math.PI * 88 * (1 - Math.min(calorieProgress, 100) / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="h-8 w-8 text-primary mb-2" />
                <div className="text-3xl font-bold">{totalCalories}</div>
                <div className="text-sm text-muted-foreground">/ {calorieGoal} kcal</div>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              {calorieGoal - totalCalories > 0 
                ? `${calorieGoal - totalCalories} kcal remaining`
                : `${totalCalories - calorieGoal} kcal over goal`}
            </p>
          </div>
        </Card>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <Beef className="h-5 w-5 text-primary mb-2" />
            <div className="text-xl font-bold">{totalProtein.toFixed(0)}g</div>
            <div className="text-xs text-muted-foreground">Protein</div>
          </Card>
          <Card className="p-4">
            <Wheat className="h-5 w-5 text-warning mb-2" />
            <div className="text-xl font-bold">{totalCarbs.toFixed(0)}g</div>
            <div className="text-xs text-muted-foreground">Carbs</div>
          </Card>
          <Card className="p-4">
            <Droplets className="h-5 w-5 text-info mb-2" />
            <div className="text-xl font-bold">{totalFats.toFixed(0)}g</div>
            <div className="text-xs text-muted-foreground">Fats</div>
          </Card>
        </div>

        {/* Today's Meals */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Today's Meals</h2>
          {todayMeals.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-2">No meals logged yet</p>
              <p className="text-muted-foreground mb-2">No meals logged yet</p>
              <p className="text-sm text-muted-foreground">Tap the scan button to log your first meal</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <Card key={meal.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">{meal.calories} kcal</p>
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
          )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}