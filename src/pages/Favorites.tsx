import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { MobileNav } from "@/components/MobileNav";
import { useFavoriteRecipes } from "@/hooks/useFavoriteRecipes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function Favorites() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favorites, isLoading, removeFavorite } = useFavoriteRecipes();
  
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [recipeDetails, setRecipeDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const handleTellMeRecipe = async (recipe: any) => {
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
          body: JSON.stringify({ recipeName: recipe.recipe_name, summary: recipe.summary }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRecipeDetails(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load recipe details", variant: "destructive" });
      setShowRecipeModal(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 p-4 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">My Favorites</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-muted-foreground">Loading favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Save recipes from the home page to see them here
            </p>
            <Button onClick={() => navigate("/")}>Explore Recipes</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="soft-card p-3 flex gap-4"
              >
                <img
                  src={recipe.recipe_image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"}
                  alt={recipe.recipe_name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <h3 className="font-medium mb-1 truncate">{recipe.recipe_name}</h3>
                  <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground">
                    <span>{recipe.calories || "?"} cal</span>
                    <span>•</span>
                    <span>P: {recipe.protein || "?"}</span>
                    <span>C: {recipe.carbs || "?"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{recipe.summary}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTellMeRecipe(recipe)}
                      className="text-sm text-accent font-medium"
                    >
                      View Recipe →
                    </button>
                    <button
                      onClick={() => removeFavorite.mutate(recipe.recipe_name)}
                      className="ml-auto p-2 text-red-500"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Details Modal */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedRecipe?.recipe_name}</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-muted-foreground">Loading recipe details...</p>
            </div>
          ) : recipeDetails ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipeDetails.ingredients?.map((ing: any, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span>
                        <strong>{ing.amount}</strong> {ing.item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Instructions</h3>
                <ol className="space-y-3">
                  {recipeDetails.instructions?.map((step: string, i: number) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium shrink-0">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
