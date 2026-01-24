import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Edit3, Flame, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // Get total calories logged
  const { data: totalCalories } = useQuery({
    queryKey: ["total-calories"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { data } = await supabase
        .from("meals")
        .select("calories")
        .eq("user_id", user.id);
      
      return data?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
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

  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  const userName = profile?.name || profile?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-wide">My Profile</h1>
        <button 
          onClick={() => navigate("/settings")}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center pressable"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Profile Card */}
        <div className="trading-card rounded-[28px] p-6 text-center">
          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/50 overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">👤</span>
              )}
            </div>
            {profile?.is_premium && (
              <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Username */}
          <h2 className="text-2xl font-bold">{userName}</h2>
          <div className="chip inline-flex items-center gap-1.5 px-3 py-1 mt-2">
            <span className="text-xs font-medium">Level 12 Scavenger</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                <Flame className="w-3 h-3" />
                <span>Streak</span>
              </div>
              <div className="text-lg font-bold">14 Days</div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                <span>🍽️</span>
                <span>Logged</span>
              </div>
              <div className="text-lg font-bold">{formatNumber(totalCalories || 0)} Cal</div>
            </div>
          </div>
        </div>

        {/* Premium Card */}
        <div className="holo-card rounded-[28px] p-5">
          <div className="flex items-start gap-4">
            <div className="text-3xl">
              <span className="font-bold text-foreground">LooKai</span>
              <span className="text-primary font-bold ml-1">Pro</span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            Valid until: {profile?.is_premium ? "Forever" : "Not subscribed"}
          </p>

          <div className="flex items-center gap-2 mt-4">
            <Crown className="w-5 h-5 text-warning" />
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>Unlock AI Food Vision</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>Unlimited Meal Logs</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-primary" />
              <span>Exclusive Dark Themes</span>
            </div>
          </div>

          {!profile?.is_premium && (
            <Button className="w-full mt-4 neon-fab rounded-full h-12">
              UPGRADE NOW | ₹49/MO
            </Button>
          )}
        </div>

        {/* Daily Goal Card */}
        <div className="trading-card rounded-[28px] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Daily Goal</h3>
            <button className="text-xs text-muted-foreground">Edit History</button>
          </div>

          <p className="text-xs text-muted-foreground mb-2">Target Calories</p>
          
          <div className="flex items-center justify-between">
            {isEditingGoal ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="number"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 2000)}
                  className="bg-muted/50 rounded-xl px-4 py-2 text-2xl font-bold w-32 focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <Button 
                  size="sm" 
                  onClick={() => updateGoalMutation.mutate()}
                  className="neon-fab"
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setIsEditingGoal(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {calorieGoal.toLocaleString()}
                  <span className="text-base font-normal text-muted-foreground ml-1">kcal</span>
                </div>
                <button
                  onClick={() => profile?.is_premium && setIsEditingGoal(true)}
                  className={`w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center ${!profile?.is_premium ? 'opacity-50' : 'pressable'}`}
                  disabled={!profile?.is_premium}
                >
                  <Edit3 className="w-4 h-4 text-muted-foreground" />
                </button>
              </>
            )}
          </div>
          
          {!profile?.is_premium && (
            <p className="text-xs text-muted-foreground mt-2">
              Upgrade to Premium to customize your goal
            </p>
          )}
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full trading-card rounded-full py-4 flex items-center justify-center gap-2 text-muted-foreground pressable"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          LooKai v1.0.4 • Build 8842
        </p>
      </div>

      <MobileNav />
    </div>
  );
}