import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Flame, Beef, Wheat, Droplets, Camera, Utensils } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

// Animated number component
function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const spring = useSpring(0, { duration: duration * 1000, bounce: 0 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    spring.set(value);
    return spring.on("change", (v) => setDisplayValue(Math.round(v).toLocaleString()));
  }, [spring, value]);

  return <>{displayValue}</>;
}

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
  const caloriesLeft = Math.max(0, calorieGoal - totalCalories);
  const calorieProgress = Math.min((totalCalories / calorieGoal) * 100, 100);
  const progressPercent = Math.round((totalCalories / calorieGoal) * 100);

  // SVG ring calculations
  const ringSize = 280;
  const strokeWidth = 16;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - calorieProgress / 100);

  const macros = [
    { label: "Protein", value: totalProtein, icon: Beef, color: "text-[#CCFF00]" },
    { label: "Carbs", value: totalCarbs, icon: Wheat, color: "text-[#CCFF00]/70" },
    { label: "Fat", value: totalFats, icon: Droplets, color: "text-[#CCFF00]/50" },
  ];

  const mealEmojis: Record<string, string> = {
    breakfast: "🥣",
    lunch: "🥗",
    dinner: "🍽️",
    snack: "🍎",
  };

  return (
    <div className="min-h-screen bg-[#000000] pb-40 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(204,255,0,0.12),transparent_70%)]" />

      <div className="container mx-auto px-4 pt-6 max-w-md relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          {/* Avatar */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-[#333] to-[#1A1A1A] border border-white/10 flex items-center justify-center overflow-hidden"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </motion.div>

          {/* Streak badge */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(204,255,0,0.15)]"
          >
            <Flame className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-sm font-medium text-white/90">12 Day Streak</span>
          </motion.div>
        </header>

        {/* Hero - Calorie Ring */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="relative" style={{ width: ringSize, height: ringSize }}>
            {/* SVG Ring */}
            <svg 
              width={ringSize} 
              height={ringSize} 
              className="transform -rotate-90"
            >
              {/* Background track */}
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#333"
                strokeWidth={strokeWidth}
              />
              {/* Progress arc */}
              <motion.circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#CCFF00"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                style={{ 
                  filter: "drop-shadow(0 0 10px #CCFF00) drop-shadow(0 0 20px rgba(204,255,0,0.5))" 
                }}
              />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span 
                className="text-6xl font-bold tracking-tighter text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <AnimatedNumber value={caloriesLeft} duration={1.2} />
              </span>
              <span className="text-sm tracking-[0.25em] text-white/60 mt-1">KCAL LEFT</span>
              <div className="mt-3 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs text-white/70">{progressPercent}% of Daily Goal</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Macro Nutrients - Bento Grid */}
        <motion.section 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-8"
        >
          {macros.map((macro, i) => (
            <motion.div
              key={macro.label}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 cursor-pointer"
            >
              <macro.icon className={`w-5 h-5 ${macro.color} mb-3`} />
              <div 
                className="text-2xl font-semibold text-white tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                {macro.value.toFixed(0)}g
              </div>
              <div className="text-xs text-white/40 tracking-wide mt-1">{macro.label}</div>
            </motion.div>
          ))}
        </motion.section>

        {/* Today's Meals */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white tracking-tight">Today's Meals</h2>
            <span className="text-sm text-white/40">{format(new Date(), "MMM d")}</span>
          </div>

          {todayMeals.length === 0 ? (
            <div className="rounded-3xl bg-[#0A0A0A] border border-white/5 p-8 text-center">
              <div className="text-4xl mb-3">🍽️</div>
              <p className="text-white/60 mb-1">No meals logged yet</p>
              <p className="text-sm text-white/40">Tap AI SCAN to log your first meal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayMeals.map((meal, i) => {
                const time = meal.created_at ? format(parseISO(meal.created_at), "h:mm a") : "";
                const mealType = meal.name?.toLowerCase().includes("breakfast") ? "breakfast" 
                  : meal.name?.toLowerCase().includes("lunch") ? "lunch"
                  : meal.name?.toLowerCase().includes("dinner") ? "dinner" : "snack";
                
                return (
                  <motion.div
                    key={meal.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
                    whileHover={{ borderColor: "rgba(204,255,0,0.3)" }}
                    className="rounded-2xl bg-[#0A0A0A] border border-white/5 p-4 flex items-center gap-4 transition-colors cursor-pointer group"
                  >
                    {/* Food emoji/icon */}
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl flex-shrink-0">
                      {mealEmojis[mealType] || "🍴"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{meal.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50 capitalize">
                          {mealType}
                        </span>
                        {time && <span className="text-xs text-white/30">{time}</span>}
                      </div>
                    </div>

                    {/* Calories */}
                    <div className="text-right flex-shrink-0">
                      <span 
                        className="text-lg font-semibold text-white"
                        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        {meal.calories}
                      </span>
                      <span className="text-sm text-white/40 ml-1">kcal</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.section>
      </div>

      {/* Floating Action Button - AI SCAN */}
      <div className="fixed inset-x-0 bottom-24 z-40 px-4">
        <div className="mx-auto max-w-md">
          <Link to="/scan">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full h-14 rounded-full bg-[#CCFF00] flex items-center justify-center gap-3 cursor-pointer overflow-hidden"
            >
              {/* Breathing glow effect */}
              <motion.div
                className="absolute inset-0 bg-[#CCFF00]"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.2)",
                    "0 0 30px rgba(204,255,0,0.6), 0 0 60px rgba(204,255,0,0.3)",
                    "0 0 20px rgba(204,255,0,0.4), 0 0 40px rgba(204,255,0,0.2)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              
              <Camera className="w-5 h-5 text-black relative z-10" />
              <span 
                className="text-base font-bold text-black tracking-wide relative z-10"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                AI SCAN
              </span>
            </motion.div>
          </Link>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}