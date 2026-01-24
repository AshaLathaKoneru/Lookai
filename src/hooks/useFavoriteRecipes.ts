import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FavoriteRecipe {
  id: string;
  recipe_name: string;
  recipe_image: string | null;
  calories: number | null;
  protein: string | null;
  carbs: string | null;
  fat: string | null;
  summary: string | null;
  created_at: string;
}

export function useFavoriteRecipes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorite-recipes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("favorite_recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FavoriteRecipe[];
    },
  });

  const isFavorite = (recipeName: string) => {
    return favorites.some(f => f.recipe_name === recipeName);
  };

  const addFavorite = useMutation({
    mutationFn: async (recipe: {
      name: string;
      image: string;
      calories: number | string;
      protein: string;
      carbs: string;
      fat: string;
      summary: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("favorite_recipes").insert({
        user_id: user.id,
        recipe_name: recipe.name,
        recipe_image: recipe.image,
        calories: typeof recipe.calories === "number" ? recipe.calories : parseInt(recipe.calories) || null,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        summary: recipe.summary,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-recipes"] });
      toast({ title: "Recipe saved!", description: "Added to your favorites" });
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already saved", description: "This recipe is in your favorites" });
      } else {
        toast({ title: "Error", description: "Failed to save recipe", variant: "destructive" });
      }
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (recipeName: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("favorite_recipes")
        .delete()
        .eq("user_id", user.id)
        .eq("recipe_name", recipeName);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite-recipes"] });
      toast({ title: "Removed", description: "Recipe removed from favorites" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove recipe", variant: "destructive" });
    },
  });

  const toggleFavorite = (recipe: {
    name: string;
    image: string;
    calories: number | string;
    protein: string;
    carbs: string;
    fat: string;
    summary: string;
  }) => {
    if (isFavorite(recipe.name)) {
      removeFavorite.mutate(recipe.name);
    } else {
      addFavorite.mutate(recipe);
    }
  };

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
}
