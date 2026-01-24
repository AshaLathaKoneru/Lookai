import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  user_id: string;
  name: string | null;
  avatar_url: string | null;
}

interface SharedMeal {
  id: string;
  user_id: string;
  meal_id: string;
  caption: string | null;
  is_public: boolean;
  likes_count: number;
  created_at: string;
  meal?: {
    id: string;
    name: string;
    calories: number;
    protein: number | null;
    carbs: number | null;
    fats: number | null;
    image_url: string | null;
  };
  profile?: Profile;
}

export function useSocial() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get users the current user is following
  const { data: following = [] } = useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (error) throw error;
      return data.map(f => f.following_id);
    },
  });

  // Get followers count
  const { data: followersCount = 0 } = useQuery({
    queryKey: ["followers-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      if (error) throw error;
      return count || 0;
    },
  });

  // Get following count
  const { data: followingCount = 0 } = useQuery({
    queryKey: ["following-count"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      if (error) throw error;
      return count || 0;
    },
  });

  // Follow a user
  const followUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("user_follows").insert({
        follower_id: user.id,
        following_id: userId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });
      toast({ title: "Following!", description: "You're now following this user" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to follow user", variant: "destructive" });
    },
  });

  // Unfollow a user
  const unfollowUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["following"] });
      queryClient.invalidateQueries({ queryKey: ["following-count"] });
      toast({ title: "Unfollowed", description: "You've unfollowed this user" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unfollow user", variant: "destructive" });
    },
  });

  // Share a meal
  const shareMeal = useMutation({
    mutationFn: async ({ mealId, caption }: { mealId: string; caption?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("shared_meals").insert({
        user_id: user.id,
        meal_id: mealId,
        caption,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-meals"] });
      toast({ title: "Shared!", description: "Your meal has been shared" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to share meal", variant: "destructive" });
    },
  });

  // Like a shared meal
  const likeMeal = useMutation({
    mutationFn: async (sharedMealId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("meal_likes").insert({
        user_id: user.id,
        shared_meal_id: sharedMealId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-meals"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to like meal", variant: "destructive" });
    },
  });

  // Unlike a shared meal
  const unlikeMeal = useMutation({
    mutationFn: async (sharedMealId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("meal_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("shared_meal_id", sharedMealId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-meals"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to unlike meal", variant: "destructive" });
    },
  });

  const isFollowing = (userId: string) => following.includes(userId);

  return {
    following,
    followersCount,
    followingCount,
    followUser,
    unfollowUser,
    shareMeal,
    likeMeal,
    unlikeMeal,
    isFollowing,
  };
}
