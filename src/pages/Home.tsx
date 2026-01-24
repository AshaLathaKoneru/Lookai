import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Bell, Star, ChevronRight, Sparkles } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

  const userName = profile?.name || profile?.email?.split("@")[0] || "User";

  // Sample food categories
  const categories = [
    { name: "Vegan", emoji: "🥬", color: "bg-green-100" },
    { name: "Carb", emoji: "🍞", color: "bg-amber-100" },
    { name: "Protein", emoji: "🥩", color: "bg-red-100" },
    { name: "Snacks", emoji: "🍪", color: "bg-orange-100" },
    { name: "Drink", emoji: "🥤", color: "bg-blue-100" },
  ];

  // Sample recipe suggestions
  const recipeSuggestions = [
    {
      id: 1,
      name: "Mediterranean Quinoa Bowl",
      calories: 420,
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop",
    },
    {
      id: 2,
      name: "Grilled Salmon Salad",
      calories: 380,
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop",
    },
    {
      id: 3,
      name: "Avocado Toast Deluxe",
      calories: 290,
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&auto=format&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="container mx-auto px-4 pt-12 max-w-md">
        {/* Header */}
        <motion.header 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-muted overflow-hidden border-2 border-border">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Good morning</p>
              <h1 className="text-lg font-semibold">Hello, {userName}</h1>
            </div>
          </div>

          {/* Notification bell */}
          <button className="w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center pressable">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.header>

        {/* Search Bar */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Describe Your Food"
              className="w-full h-14 pl-5 pr-28 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              onClick={() => navigate("/scan")}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Assistant
            </Button>
          </div>
        </motion.div>

        {/* Pro Banner */}
        {!profile?.is_premium && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mb-6"
          >
            <div className="pro-gradient soft-card p-5 flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">Get Pro Access</h3>
                <p className="text-sm text-muted-foreground">Unlock unlimited AI scans</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-card rounded-full px-2 py-1">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-xs font-medium">4.8</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Categories */}
        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Categories</h2>
            <button className="text-sm text-muted-foreground">See all</button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((category, i) => (
              <motion.div
                key={category.name}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.25 + i * 0.05 }}
                className="category-chip pressable flex-shrink-0"
              >
                <div className={`category-chip-icon ${category.color}`}>
                  {category.emoji}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{category.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Today's Meals or Recipe Suggestions */}
        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">
              {todayMeals.length > 0 ? "Today's Meals" : "Recipe Suggestions"}
            </h2>
            <button className="text-sm text-muted-foreground">See all</button>
          </div>

          {todayMeals.length > 0 ? (
            <div className="space-y-3">
              {todayMeals.slice(0, 3).map((meal, i) => (
                <motion.div
                  key={meal.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.1 }}
                  className="soft-card p-4 flex items-center gap-4 pressable"
                >
                  <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{meal.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="macro-chip">
                        <span className="macro-dot macro-dot-carbs" />
                        {Number(meal.carbs).toFixed(0)}g
                      </span>
                      <span className="macro-chip">
                        <span className="macro-dot macro-dot-protein" />
                        {Number(meal.protein).toFixed(0)}g
                      </span>
                      <span className="macro-chip">
                        <span className="macro-dot macro-dot-fat" />
                        {Number(meal.fats).toFixed(0)}g
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{meal.calories}</span>
                    <span className="text-sm text-muted-foreground ml-1">cal</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recipeSuggestions.map((recipe, i) => (
                <motion.div
                  key={recipe.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.1 }}
                  className="recipe-card flex gap-4 p-3 pressable"
                >
                  <img
                    src={recipe.image}
                    alt={recipe.name}
                    className="w-24 h-24 rounded-2xl object-cover"
                  />
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-medium mb-1">{recipe.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                        <span className="text-sm font-medium">{recipe.rating}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm text-muted-foreground">{recipe.calories} cal</span>
                    </div>
                    <button className="text-sm text-accent font-medium self-start">
                      Tell me Recipe →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </div>

      <MobileNav />
    </div>
  );
}
