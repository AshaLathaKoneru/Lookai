import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Flame, Beef, Wheat, Droplets, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "react-router-dom";

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
    <div className="min-h-screen bg-background pb-24">
      {/* subtle top glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-56 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.22),transparent_70%)]" />

      <div className="container mx-auto p-4 max-w-2xl">
        <header className="mb-6 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Hello, <span className="neon-text">{profile?.name || "there"}</span>
            </h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMM d")}</p>
          </div>

          <Link
            to="/scan"
            className="glass-panel inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs text-foreground"
            aria-label="Scan a meal"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Scan</span>
          </Link>
        </header>

        {/* Calorie Dial */}
        <Card className="glass-panel p-6 mb-6">
          <div className="flex items-center justify-center">
            <div className="relative w-64 h-64">
              {(() => {
                const r = 118;
                const c = 2 * Math.PI * r;
                const clamped = Math.min(calorieProgress, 100);
                const dashTo = c * (1 - clamped / 100);
                return (
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260" aria-label="Daily calorie progress">
                    <defs>
                      <linearGradient id="dial" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.55" />
                      </linearGradient>
                    </defs>

                    <circle cx="130" cy="130" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="14" />

                    <circle
                      cx="130"
                      cy="130"
                      r={r}
                      fill="none"
                      stroke="url(#dial)"
                      strokeWidth="14"
                      strokeDasharray={c}
                      style={{
                        // CSS anim uses these custom props
                        ["--dial-from" as any]: c,
                        ["--dial-to" as any]: dashTo,
                      }}
                      strokeDashoffset={dashTo}
                      strokeLinecap="round"
                      className="dial-glow dial-reveal"
                    />
                  </svg>
                );
              })()}

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 glass-panel">
                  <Flame className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Today</span>
                </div>

                <div className="mt-4 text-6xl font-semibold tracking-tight neon-text">{totalCalories}</div>
                <div className="text-sm text-muted-foreground">/ {calorieGoal} kcal</div>

                <div className="mt-4 text-xs text-muted-foreground">
                  {calorieGoal - totalCalories > 0
                    ? `${calorieGoal - totalCalories} kcal remaining`
                    : `${totalCalories - calorieGoal} kcal over goal`}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Bento Macros */}
        <section className="mb-6">
          <div className="grid grid-cols-3 gap-3">
            <Card className="glass-panel p-4">
              <Beef className="h-5 w-5 text-primary mb-2" />
              <div className="text-2xl font-semibold tracking-tight">{totalProtein.toFixed(0)}g</div>
              <div className="text-xs text-muted-foreground">Protein</div>
            </Card>
            <Card className="glass-panel p-4">
              <Wheat className="h-5 w-5 text-warning mb-2" />
              <div className="text-2xl font-semibold tracking-tight">{totalCarbs.toFixed(0)}g</div>
              <div className="text-xs text-muted-foreground">Carbs</div>
            </Card>
            <Card className="glass-panel p-4">
              <Droplets className="h-5 w-5 text-info mb-2" />
              <div className="text-2xl font-semibold tracking-tight">{totalFats.toFixed(0)}g</div>
              <div className="text-xs text-muted-foreground">Fats</div>
            </Card>
          </div>
        </section>

        {/* Today's Meals */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold tracking-tight">Meals</h2>
            <span className="text-xs text-muted-foreground">Today</span>
          </div>

          {todayMeals.length === 0 ? (
            <Card className="glass-panel p-6 text-center">
              <p className="text-muted-foreground mb-1">No meals logged yet</p>
              <p className="text-sm text-muted-foreground">Tap Scan to log your first meal.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal) => (
                <Card key={meal.id} className="glass-panel p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold tracking-tight truncate">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">{meal.calories} kcal</p>
                    </div>

                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      <div>P {Number(meal.protein).toFixed(0)}g</div>
                      <div>C {Number(meal.carbs).toFixed(0)}g</div>
                      <div>F {Number(meal.fats).toFixed(0)}g</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <MobileNav />
    </div>
  );
}