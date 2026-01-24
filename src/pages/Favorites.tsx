import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart } from "lucide-react";
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
      <div className="px-5 pt-14 max-w-md mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-4 mb-8"
        >
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center pressable">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-display">Saved Recipes</h1>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="premium-card p-4 flex gap-4">
                <div className="skeleton w-20 h-20 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-5 w-3/4 rounded-lg" />
                  <div className="skeleton h-4 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary flex items-center justify-center">
              <Heart className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-section mb-2">No saved recipes</p>
            <p className="text-caption mb-6">Save recipes from home to see them here</p>
            <Button onClick={() => navigate("/")} className="rounded-full">Explore Recipes</Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {favorites.map((recipe, i) => (
              <motion.div
                key={recipe.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="premium-card p-4 flex gap-4"
              >
                <img
                  src={recipe.recipe_image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"}
                  alt={recipe.recipe_name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                  <div>
                    <h3 className="font-semibold text-[15px] truncate mb-1">{recipe.recipe_name}</h3>
                    <p className="text-caption">{recipe.calories || "?"} cal • P: {recipe.protein || "?"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <button onClick={() => handleTellMeRecipe(recipe)} className="text-sm font-medium text-accent pressable">
                      View Recipe
                    </button>
                    <button onClick={() => removeFavorite.mutate(recipe.recipe_name)} className="p-1.5 pressable">
                      <Heart className="w-4 h-4 text-destructive fill-destructive" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-display">{selectedRecipe?.recipe_name}</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-4 w-full rounded-lg" />
              ))}
            </div>
          ) : recipeDetails ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-section mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipeDetails.ingredients?.map((ing: any, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-body">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                      <span><strong>{ing.amount}</strong> {ing.item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-section mb-3">Instructions</h3>
                <ol className="space-y-4">
                  {recipeDetails.instructions?.map((step: string, i: number) => (
                    <li key={i} className="flex gap-3 text-body">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
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
