import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Crown, Settings, LogOut, Target, Camera, Star, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Profile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      return data;
    },
  });

  // Get total meals logged
  const { data: totalMeals } = useQuery({
    queryKey: ["total-meals"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count } = await supabase
        .from("meals")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      return count || 0;
    },
  });

  const [calorieGoal, setCalorieGoal] = useState(profile?.calorie_goal || 2000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    if (profile?.calorie_goal) {
      setCalorieGoal(profile.calorie_goal);
    }
  }, [profile?.calorie_goal]);

  const updateGoalMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ calorie_goal: calorieGoal })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Goal Updated" });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditingGoal(false);
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const userName = profile?.name || profile?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <motion.div 
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-4 pt-12 pb-6 flex items-center justify-between"
      >
        <h1 className="text-xl font-bold">Profile</h1>
        <button 
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center pressable"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </motion.div>

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="soft-card p-6 text-center"
        >
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-muted overflow-hidden border-4 border-card">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">👤</div>
              )}
            </div>
            {profile?.is_premium && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <Crown className="w-4 h-4 text-accent-foreground" />
              </div>
            )}
          </div>

          {/* Username */}
          <h2 className="text-xl font-bold">{userName}</h2>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalMeals || 0}</div>
              <div className="text-xs text-muted-foreground">Meals Logged</div>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <div className="text-2xl font-bold">14</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </motion.div>

        {/* Premium Card */}
        {!profile?.is_premium && (
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="soft-card p-5 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">LooKai Pro</h3>
                <p className="text-sm text-muted-foreground">Unlock all features</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-accent" />
                <span>Unlimited AI Food Scans</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-accent" />
                <span>Custom Calorie Goals</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-accent" />
                <span>Priority Support</span>
              </div>
            </div>

            <Button className="w-full h-12 rounded-full">
              Upgrade Now • ₹49/month
            </Button>
          </motion.div>
        )}

        {/* Daily Goal Card */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="soft-card p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
              <Target className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Daily Calorie Goal</h3>
              {isEditingGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 2000)}
                    className="w-24 h-8 bg-muted rounded-lg px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    onClick={() => updateGoalMutation.mutate()}
                    className="h-8 rounded-lg"
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{calorieGoal.toLocaleString()} calories</p>
              )}
            </div>
            <button
              onClick={() => setIsEditingGoal(!isEditingGoal)}
              className="text-muted-foreground pressable"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="soft-card overflow-hidden"
        >
          <button
            onClick={() => navigate("/settings")}
            className="w-full p-4 flex items-center gap-3 border-b border-border pressable"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => navigate("/scan")}
            className="w-full p-4 flex items-center gap-3 border-b border-border pressable"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">Scan Food</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={() => {}}
            className="w-full p-4 flex items-center gap-3 pressable"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Star className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium">Rate App</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={handleSignOut}
          className="w-full soft-card p-4 flex items-center justify-center gap-2 text-destructive pressable"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </motion.button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-2 pb-4">
          LooKai v1.0.4 • Build 8842
        </p>
      </div>

      <MobileNav />
    </div>
  );
}
