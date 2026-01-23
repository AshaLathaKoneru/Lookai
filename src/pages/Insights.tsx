import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/MobileNav";
import { ArrowLeft, Crown, Lock, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";

export default function Insights() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"this" | "last">("this");

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  // Fetch weekly meals data
  const { data: weeklyMeals } = useQuery({
    queryKey: ["weekly-meals", activeTab],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() - (activeTab === "last" ? 7 : 0));
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("meal_date", startOfWeek.toISOString().split("T")[0])
        .lt("meal_date", endOfWeek.toISOString().split("T")[0]);

      return data || [];
    },
    enabled: !!profile?.is_premium,
  });

  const weeklyStats = useMemo(() => {
    if (!weeklyMeals?.length) {
      return {
        totalCalories: 0,
        dailyAverage: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        daysLogged: 0,
      };
    }

    const totals = weeklyMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fats: acc.fats + (meal.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const uniqueDays = new Set(weeklyMeals.map(m => m.meal_date)).size;

    return {
      totalCalories: totals.calories,
      dailyAverage: uniqueDays > 0 ? Math.round(totals.calories / uniqueDays) : 0,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
      daysLogged: uniqueDays,
    };
  }, [weeklyMeals]);

  // Targets
  const targets = { protein: 160, carbs: 250, fats: 70 };

  if (!profile?.is_premium) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="px-4 pt-12 pb-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-semibold">Weekly Insights</h1>
          <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-4">
          <div className="holo-card rounded-[28px] p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              Upgrade to LooKai Premium to unlock weekly insights, advanced analytics, and more!
            </p>
            
            <div className="trading-card rounded-[20px] p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-5 w-5 text-warning" />
                <span className="font-semibold">LooKai Premium</span>
              </div>
              <div className="text-2xl font-bold mb-3">₹49/month</div>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>✓ Unlimited scans</li>
                <li>✓ Weekly insights & charts</li>
                <li>✓ Custom calorie goals</li>
                <li>✓ Advanced analytics</li>
              </ul>
            </div>
            
            <Button className="w-full neon-fab rounded-full h-12">
              Upgrade to Premium
            </Button>
          </div>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center pressable">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Weekly Insights</h1>
        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center pressable">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Tab Toggle */}
        <div className="flex justify-center">
          <div className="glass-panel rounded-full p-1 flex">
            <button
              onClick={() => setActiveTab("this")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "this" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setActiveTab("last")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "last" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Last Week
            </button>
          </div>
        </div>

        {/* Total Consumption Card */}
        <div className="trading-card rounded-[28px] p-6">
          <div className="text-center mb-4">
            <div className="text-5xl font-bold neon-text">
              {weeklyStats.totalCalories.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">kcal</div>
            <div className="text-xs text-muted-foreground mt-1">Total Consumption</div>
          </div>

          {/* Stats chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <div className="chip px-3 py-1.5 flex items-center gap-1.5">
              <span>🔥</span>
              <span className="text-xs font-medium">{weeklyStats.daysLogged} Day Streak</span>
            </div>
            <div className="chip px-3 py-1.5 flex items-center gap-1.5">
              <span>🎯</span>
              <span className="text-xs font-medium">On Target</span>
            </div>
            <div className="chip px-3 py-1.5 flex items-center gap-1.5">
              <span>⚡️</span>
              <span className="text-xs font-medium">High Energy</span>
            </div>
          </div>

          {/* Daily Average */}
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Daily Average</span>
            <div className="flex items-center gap-2">
              <span className="font-bold">{weeklyStats.dailyAverage.toLocaleString()} kcal</span>
              <div className="chip px-2 py-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-xs text-primary font-medium">+5%</span>
              </div>
            </div>
          </div>

          {/* Chart placeholder (days of week) */}
          <div className="flex justify-between mt-6 px-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-2">
                <div 
                  className="w-2 rounded-full bg-primary/30"
                  style={{ height: `${20 + Math.random() * 40}px` }}
                />
                <span className="text-[10px] text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Macro Breakdown */}
        <div className="trading-card rounded-[28px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">MACRO BREAKDOWN</h3>
            <button className="text-xs text-muted-foreground">Details</button>
          </div>

          <div className="space-y-4">
            {/* Protein */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💪</span>
                <span className="text-sm font-medium">Protein</span>
                <span className="ml-auto text-sm">
                  {weeklyStats.protein}g / {targets.protein}g
                </span>
                <span className="chip px-2 py-0.5 text-xs">
                  {Math.round((weeklyStats.protein / targets.protein) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${Math.min((weeklyStats.protein / targets.protein) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🍞</span>
                <span className="text-sm font-medium">Carbs</span>
                <span className="ml-auto text-sm">
                  {weeklyStats.carbs}g / {targets.carbs}g
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/70 rounded-full transition-all"
                  style={{ width: `${Math.min((weeklyStats.carbs / targets.carbs) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Fats */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🥑</span>
                <span className="text-sm font-medium">Fats</span>
                <span className="ml-auto text-sm">
                  {weeklyStats.fats}g / {targets.fats}g
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/50 rounded-full transition-all"
                  style={{ width: `${Math.min((weeklyStats.fats / targets.fats) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Insight */}
        <div className="trading-card rounded-[28px] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <span className="text-sm font-medium text-primary">LooKai AI</span>
          </div>
          <p className="text-sm text-muted-foreground italic">
            "You crushed your protein goals this week! 🚀 Try adding more fiber-rich veggies on Saturday to balance out the weekend cheat meal."
          </p>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}