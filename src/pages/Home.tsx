import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search, ChevronRight, Loader2, X, Clock, Users, Leaf, Heart } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useFavoriteRecipes } from "@/hooks/useFavoriteRecipes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Recipe {
  name: string;
  image: string;
  calories: number | string;
  protein: string;
  carbs: string;
  fat: string;
  summary: string;
}

interface RecipeDetails {
  name: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: { item: string; amount: string; notes?: string }[];
  instructions: string[];
  substitutes: { original: string; substitute: string; notes?: string }[];
  nutritionTips: string;
}

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavoriteRecipes();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [aiRecipes, setAiRecipes] = useState<Recipe[] | null>(null);
  const [noResults, setNoResults] = useState(false);
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

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

  const categories = [
    { name: "Vegan", icon: "🥬" },
    { name: "High Protein", icon: "🥩" },
    { name: "Low Carb", icon: "🥗" },
    { name: "Quick Meals", icon: "⚡" },
    { name: "Smoothies", icon: "🥤" },
  ];

  const defaultRecipes = [
    {
      name: "Mediterranean Quinoa Bowl",
      calories: 420,
      protein: "18g",
      carbs: "52g",
      fat: "16g",
      summary: "Healthy grain bowl with fresh vegetables",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop",
    },
    {
      name: "Grilled Salmon Salad",
      calories: 380,
      protein: "32g",
      carbs: "12g",
      fat: "24g",
      summary: "Omega-3 rich salmon with greens",
      image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&auto=format&fit=crop",
    },
    {
      name: "Avocado Toast Deluxe",
      calories: 290,
      protein: "8g",
      carbs: "28g",
      fat: "18g",
      summary: "Creamy avocado on whole grain bread",
      image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&auto=format&fit=crop",
    },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a food",
        description: "Type something like 'chicken salad' or 'smoothie bowl'",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setNoResults(false);
    setAiRecipes(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recipe-suggestions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ query: searchQuery }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: "Too many requests", description: "Please wait a moment.", variant: "destructive" });
        } else if (response.status === 402) {
          toast({ title: "Credits needed", description: "AI service requires credits.", variant: "destructive" });
        } else {
          throw new Error(data.error || "Failed to get recipes");
        }
        return;
      }

      if (data.recipes && data.recipes.length > 0) {
        setAiRecipes(data.recipes);
      } else {
        setNoResults(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search recipes",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleTellMeRecipe = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
    setIsLoadingDetails(true);
    setRecipeDetails(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-recipe-details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ recipeName: recipe.name, summary: recipe.summary }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get recipe details");
      }

      setRecipeDetails(data);
    } catch (error) {
      console.error("Recipe details error:", error);
      toast({
        title: "Error",
        description: "Failed to load recipe details",
        variant: "destructive",
      });
      setShowRecipeModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const displayRecipes = aiRecipes || defaultRecipes;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-14 max-w-md mx-auto">
        {/* Header */}
        <motion.header 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-3">
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
              <p className="text-caption">Good morning</p>
              <h1 className="text-section">Hello, {userName}</h1>
            </div>
          </div>
        </motion.header>

        {/* Search Bar */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for recipes..."
              className="premium-input pl-14 pr-24"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 rounded-full"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </motion.div>

        {/* Premium Banner */}
        {!profile?.is_premium && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <div className="premium-card p-5 flex items-center justify-between">
              <div>
                <p className="text-section mb-0.5">Unlock Premium</p>
                <p className="text-caption">Unlimited scans & insights</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </motion.div>
        )}

        {/* Categories */}
        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="mb-8"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
            {categories.map((category, i) => (
              <motion.button
                key={category.name}
                onClick={() => {
                  setSearchQuery(category.name.toLowerCase());
                  handleSearch();
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.2 + i * 0.03 }}
                className="category-chip flex-shrink-0 pressable"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Today's Meals */}
        {todayMeals.length > 0 && (
          <motion.section
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-section">Today's Meals</h2>
              <button onClick={() => navigate("/log")} className="text-caption">See all</button>
            </div>

            <div className="space-y-3">
              {todayMeals.slice(0, 2).map((meal, i) => (
                <motion.div
                  key={meal.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.25 + i * 0.05 }}
                  className="premium-card p-4 flex items-center gap-4 pressable"
                >
                  <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-xl">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[15px] truncate mb-1">{meal.name}</h3>
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
                  <div className="text-right">
                    <span className="text-lg text-number">{meal.calories}</span>
                    <span className="text-caption ml-1">cal</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Recipe Suggestions */}
        <motion.section
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-section">
              {aiRecipes ? `Results for "${searchQuery}"` : "Recipe Ideas"}
            </h2>
            {aiRecipes && (
              <button 
                onClick={() => { setAiRecipes(null); setSearchQuery(""); }}
                className="text-caption flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {isSearching ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="premium-card p-4 flex gap-4">
                  <div className="skeleton w-24 h-24 rounded-2xl" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="skeleton h-5 w-3/4 rounded-lg" />
                    <div className="skeleton h-4 w-1/2 rounded-lg" />
                    <div className="skeleton h-4 w-2/3 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : noResults ? (
            <div className="text-center py-16">
              <p className="text-display mb-2">No recipes found</p>
              <p className="text-caption">Try a different search term</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {displayRecipes.map((recipe, i) => (
                  <motion.div
                    key={recipe.name + i}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="recipe-card flex gap-4 p-4"
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-24 h-24 rounded-2xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop";
                      }}
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                      <div>
                        <h3 className="font-semibold text-[15px] mb-1 line-clamp-1">{recipe.name}</h3>
                        <p className="text-caption line-clamp-1 mb-2">{recipe.summary}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{recipe.calories} cal</span>
                          <span className="macro-badge">P: {recipe.protein}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleTellMeRecipe(recipe)}
                            className="text-sm font-medium text-accent pressable"
                          >
                            View
                          </button>
                          <button
                            onClick={() => toggleFavorite(recipe)}
                            className="p-1.5 pressable"
                          >
                            <Heart className={`w-4 h-4 transition-colors ${
                              isFavorite(recipe.name) ? "text-destructive fill-destructive" : "text-muted-foreground"
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>
      </div>

      {/* Recipe Details Modal */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-display">{selectedRecipe?.name}</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4 py-8">
              <div className="skeleton h-6 w-2/3 rounded-lg mx-auto" />
              <div className="skeleton h-4 w-1/2 rounded-lg mx-auto" />
              <div className="space-y-2 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton h-4 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : recipeDetails ? (
            <div className="space-y-6">
              {/* Time & Servings */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{recipeDetails.prepTime} prep</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{recipeDetails.cookTime} cook</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{recipeDetails.servings} servings</span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-section mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipeDetails.ingredients?.map((ing, i) => (
                    <li key={i} className="flex items-start gap-3 text-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                      <span>
                        <strong>{ing.amount}</strong> {ing.item}
                        {ing.notes && <span className="text-muted-foreground"> ({ing.notes})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-section mb-3">Instructions</h3>
                <ol className="space-y-4">
                  {recipeDetails.instructions?.map((step, i) => (
                    <li key={i} className="flex gap-3 text-body">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Substitutes */}
              {recipeDetails.substitutes && recipeDetails.substitutes.length > 0 && (
                <div>
                  <h3 className="text-section mb-3 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-accent" />
                    Substitutions
                  </h3>
                  <ul className="space-y-2">
                    {recipeDetails.substitutes.map((sub, i) => (
                      <li key={i} className="text-body bg-secondary rounded-xl p-3">
                        <span className="font-medium">{sub.original}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="text-accent font-medium">{sub.substitute}</span>
                        {sub.notes && <p className="text-caption mt-1">{sub.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nutrition Tips */}
              {recipeDetails.nutritionTips && (
                <div className="bg-accent/10 rounded-xl p-4">
                  <p className="text-body">
                    <strong>Tip:</strong> {recipeDetails.nutritionTips}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
