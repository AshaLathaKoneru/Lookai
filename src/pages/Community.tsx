import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Trophy, Heart, MessageCircle, Share2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/MobileNav";
import { useSocial } from "@/hooks/useSocial";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Community() {
  const navigate = useNavigate();
  const { followersCount, followingCount, likeMeal, unlikeMeal } = useSocial();

  // Get my likes
  const { data: myLikes = [] } = useQuery({
    queryKey: ["my-likes"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("meal_likes")
        .select("shared_meal_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(l => l.shared_meal_id);
    },
  });

  // Get shared meals feed
  const { data: sharedMeals = [], isLoading: loadingFeed } = useQuery({
    queryKey: ["shared-meals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_meals")
        .select(`
          *,
          meals (id, name, calories, protein, carbs, fats, image_url),
          profiles:user_id (user_id, name, avatar_url)
        `)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
  });

  // Get leaderboard
  const { data: leaderboard = [], isLoading: loadingLeaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_leaderboard")
        .select("*")
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const isLiked = (mealId: string) => myLikes.includes(mealId);

  const handleLike = (mealId: string) => {
    if (isLiked(mealId)) {
      unlikeMeal.mutate(mealId);
    } else {
      likeMeal.mutate(mealId);
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
          <h1 className="text-xl font-bold">Community</h1>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 pb-4">
          <div className="text-center">
            <div className="font-bold">{followersCount}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold">{followingCount}</div>
            <div className="text-xs text-muted-foreground">Following</div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-md">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="feed">
              <Users className="w-4 h-4 mr-2" />
              Feed
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="space-y-4">
            {loadingFeed ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Loading feed...</p>
              </div>
            ) : sharedMeals.length === 0 ? (
              <div className="text-center py-12">
                <Share2 className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-lg font-semibold mb-2">No shared meals yet</h2>
                <p className="text-muted-foreground">
                  Be the first to share a meal!
                </p>
              </div>
            ) : (
              sharedMeals.map((post: any, i) => (
                <motion.div
                  key={post.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="soft-card overflow-hidden"
                >
                  {/* User Header */}
                  <div className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">👤</div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{post.profiles?.name || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(post.created_at), "MMM d 'at' h:mm a")}
                      </div>
                    </div>
                  </div>

                  {/* Meal Image */}
                  {post.meals?.image_url && (
                    <img
                      src={post.meals.image_url}
                      alt={post.meals.name}
                      className="w-full aspect-square object-cover"
                    />
                  )}

                  {/* Meal Info */}
                  <div className="p-4">
                    <h3 className="font-medium mb-1">{post.meals?.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span>{post.meals?.calories} cal</span>
                      <span>•</span>
                      <span>P: {post.meals?.protein}g</span>
                      <span>C: {post.meals?.carbs}g</span>
                      <span>F: {post.meals?.fats}g</span>
                    </div>
                    {post.caption && (
                      <p className="text-sm mb-3">{post.caption}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 ${isLiked(post.id) ? "text-red-500" : "text-muted-foreground"}`}
                      >
                        <Heart className={`w-5 h-5 ${isLiked(post.id) ? "fill-current" : ""}`} />
                        <span className="text-sm">{post.likes_count}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-3">
            {loadingLeaderboard ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="text-muted-foreground">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-lg font-semibold mb-2">No data yet</h2>
                <p className="text-muted-foreground">
                  Start logging meals to appear here!
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Weekly leaderboard based on meals logged
                </p>
                {leaderboard.map((user: any, i) => (
                  <motion.div
                    key={user.user_id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="soft-card p-4 flex items-center gap-4"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      i === 0 ? "bg-yellow-100 text-yellow-700" :
                      i === 1 ? "bg-gray-100 text-gray-700" :
                      i === 2 ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">👤</div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.name || "Anonymous"}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.meals_logged} meals • {user.total_calories} cal
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">{user.goal_percentage}%</div>
                      <div className="text-xs text-muted-foreground">of goal</div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav />
    </div>
  );
}
