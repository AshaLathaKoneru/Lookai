import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Bell, Star, ChevronRight, Sparkles, Loader2, X, Clock, Users, Leaf, Heart, Calendar } from "lucide-react";
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

  const userName = profile?.name || profile?.email?.split("@")[0] || "User";

  const categories = [
    { name: "Vegan", emoji: "🥬", color: "bg-green-100" },
    { name: "Carb", emoji: "🍞", color: "bg-amber-100" },
    { name: "Protein", emoji: "🥩", color: "bg-red-100" },
    { name: "Snacks", emoji: "🍪", color: "bg-orange-100" },
    { name: "Drink", emoji: "🥤", color: "bg-blue-100" },
  ];

  // Default recipe suggestions
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
        title: "Please enter a food",
        description: "Type a food name like 'chicken biryani' or 'smoothie bowl'",
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
          toast({ title: "Too many requests", description: "Please wait a moment and try again.", variant: "destructive" });
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
      <div className="container mx-auto px-4 pt-12 max-w-md">
        {/* Header */}
        <motion.header 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Describe Your Food (e.g. chicken biryani)"
              className="w-full h-14 pl-5 pr-32 rounded-2xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-xl"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Assistant
                </>
              )}
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
              <motion.button
                key={category.name}
                onClick={() => {
                  setSearchQuery(category.name.toLowerCase());
                  handleSearch();
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2, delay: 0.25 + i * 0.05 }}
                className="category-chip pressable flex-shrink-0"
              >
                <div className={`category-chip-icon ${category.color}`}>
                  {category.emoji}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{category.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* Today's Meals */}
        {todayMeals.length > 0 && (
          <motion.section
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Today's Meals</h2>
              <button onClick={() => navigate("/log")} className="text-sm text-muted-foreground">See all</button>
            </div>

            <div className="space-y-3">
              {todayMeals.slice(0, 2).map((meal, i) => (
                <motion.div
                  key={meal.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.1 }}
                  className="soft-card p-4 flex items-center gap-4 pressable"
                >
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-xl">
                    🍽️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-sm">{meal.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="macro-chip text-xs">
                        <span className="macro-dot macro-dot-carbs" />
                        {Number(meal.carbs).toFixed(0)}g
                      </span>
                      <span className="macro-chip text-xs">
                        <span className="macro-dot macro-dot-protein" />
                        {Number(meal.protein).toFixed(0)}g
                      </span>
                      <span className="macro-chip text-xs">
                        <span className="macro-dot macro-dot-fat" />
                        {Number(meal.fats).toFixed(0)}g
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{meal.calories}</span>
                    <span className="text-xs text-muted-foreground ml-1">cal</span>
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
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">
              {aiRecipes ? `Recipes for "${searchQuery}"` : "Recipe Suggestions"}
            </h2>
            {aiRecipes && (
              <button 
                onClick={() => { setAiRecipes(null); setSearchQuery(""); }}
                className="text-sm text-muted-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Finding healthy recipes...</p>
            </div>
          ) : noResults ? (
            <div className="text-center py-12">
              <p className="text-xl mb-2">🍽️</p>
              <p className="text-muted-foreground">No recipes found. Try a different food!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="wait">
                {displayRecipes.map((recipe, i) => (
                  <motion.div
                    key={recipe.name + i}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="recipe-card flex gap-4 p-3 pressable"
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.name}
                      className="w-24 h-24 rounded-2xl object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop";
                      }}
                    />
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <h3 className="font-medium mb-1 truncate">{recipe.name}</h3>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">
                          {typeof recipe.calories === "number" ? recipe.calories : recipe.calories} cal
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">P: {recipe.protein}</span>
                        <span className="text-xs text-muted-foreground">C: {recipe.carbs}</span>
                        <span className="text-xs text-muted-foreground">F: {recipe.fat}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{recipe.summary}</p>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleTellMeRecipe(recipe)}
                          className="text-sm text-accent font-medium"
                        >
                          Tell me Recipe →
                        </button>
                        <button
                          onClick={() => toggleFavorite(recipe)}
                          className={`p-1.5 rounded-full transition-colors ${
                            isFavorite(recipe.name) ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorite(recipe.name) ? "fill-current" : ""}`} />
                        </button>
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
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedRecipe?.name}</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading recipe details...</p>
            </div>
          ) : recipeDetails ? (
            <div className="space-y-6">
              {/* Time & Servings */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Prep: {recipeDetails.prepTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Cook: {recipeDetails.cookTime}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{recipeDetails.servings} servings</span>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="font-semibold mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipeDetails.ingredients?.map((ing, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
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
                <h3 className="font-semibold mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {recipeDetails.instructions?.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
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
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-accent" />
                    Substitution Tips
                  </h3>
                  <ul className="space-y-2">
                    {recipeDetails.substitutes.map((sub, i) => (
                      <li key={i} className="text-sm bg-muted/50 rounded-lg p-3">
                        <span className="font-medium">{sub.original}</span>
                        <span className="mx-2">→</span>
                        <span className="text-accent font-medium">{sub.substitute}</span>
                        {sub.notes && <p className="text-muted-foreground mt-1 text-xs">{sub.notes}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Nutrition Tips */}
              {recipeDetails.nutritionTips && (
                <div className="bg-accent/10 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Health Tip:</strong> {recipeDetails.nutritionTips}
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
