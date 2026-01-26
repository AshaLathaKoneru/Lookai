import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Camera, Plus } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalorieRing } from "@/components/CalorieRing";
import { Button } from "@/components/ui/button";

export default function Home() {
  const navigate = useNavigate();

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

  const userName = profile?.name || profile?.email?.split("@")[0] || "there";
  const calorieGoal = profile?.calorie_goal || 2000;

  // Calculate consumed calories and macros from today's meals
  const consumedCalories = useMemo(() => {
    return todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  }, [todayMeals]);

  const totalMacros = useMemo(() => {
    return todayMeals.reduce(
      (acc, meal) => ({
        protein: acc.protein + (Number(meal.protein) || 0),
        carbs: acc.carbs + (Number(meal.carbs) || 0),
        fats: acc.fats + (Number(meal.fats) || 0),
      }),
      { protein: 0, carbs: 0, fats: 0 }
    );
  }, [todayMeals]);

  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="px-5 pt-14 max-w-md mx-auto">
        {/* Header */}
        <motion.header
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-11 h-11 rounded-full bg-secondary overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</p>
              <h1 className="text-[20px] font-semibold tracking-tight">Hello, {userName}</h1>
            </div>
          </div>
        </motion.header>

        {/* Calorie Ring Widget */}
        <motion.section
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mb-8"
        >
          <div className="premium-card p-6 flex flex-col items-center">
            <CalorieRing consumed={consumedCalories} goal={calorieGoal} />

            {/* Macros */}
            <div className="flex items-center gap-4 mt-6 w-full justify-center">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-macro-protein" />
                  <span className="text-[13px] text-muted-foreground">Protein</span>
                </div>
                <span className="text-[17px] font-semibold">{Math.round(totalMacros.protein)}g</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-macro-carbs" />
                  <span className="text-[13px] text-muted-foreground">Carbs</span>
                </div>
                <span className="text-[17px] font-semibold">{Math.round(totalMacros.carbs)}g</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-macro-fat" />
                  <span className="text-[13px] text-muted-foreground">Fats</span>
                </div>
                <span className="text-[17px] font-semibold">{Math.round(totalMacros.fats)}g</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Scan CTA */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <Button
            onClick={() => navigate("/scan")}
            className="w-full h-14 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-[15px] flex items-center justify-center gap-2 pressable"
          >
            <Camera className="w-5 h-5" />
            Scan Food
          </Button>
        </motion.div>

        {/* Premium Banner (if not premium) */}
        {!profile?.is_premium && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-8"
          >
            <div
              className="premium-card p-5 bg-gradient-to-br from-accent/5 to-accent/10 pressable"
              onClick={() => navigate("/profile")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[17px] font-semibold mb-0.5">Unlock Premium</p>
                  <p className="text-[13px] text-muted-foreground">Unlimited scans & insights</p>
                </div>
                <div className="text-[22px] font-bold text-accent">₹49</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Today's Meals */}
        {todayMeals.length > 0 && (
          <motion.section
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[17px] font-semibold">Today's Meals</h2>
              <button
                onClick={() => navigate("/log")}
                className="text-[13px] text-muted-foreground pressable"
              >
                See all
              </button>
            </div>

            <div className="space-y-3">
              {todayMeals.slice(0, 3).map((meal, i) => (
                <motion.div
                  key={meal.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                  className="premium-card p-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center overflow-hidden">
                    {meal.image_url ? (
                      <img src={meal.image_url} alt={meal.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">🍽️</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[15px] truncate mb-1">{meal.name}</h3>
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      <span>P: {Math.round(Number(meal.protein))}g</span>
                      <span>C: {Math.round(Number(meal.carbs))}g</span>
                      <span>F: {Math.round(Number(meal.fats))}g</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[20px] font-bold tabular-nums">{meal.calories}</div>
                    <div className="text-[12px] text-muted-foreground">cal</div>
                  </div>
                </motion.div>
              ))}
            </div>

            {todayMeals.length === 0 && (
              <div className="premium-card p-8 text-center">
                <div className="text-4xl mb-3">🍽️</div>
                <p className="text-[15px] text-muted-foreground">No meals logged today</p>
                <p className="text-[13px] text-muted-foreground mt-1">Start by scanning your first meal</p>
              </div>
            )}
          </motion.section>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
