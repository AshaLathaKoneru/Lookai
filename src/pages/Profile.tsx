import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Settings, LogOut, Target, Camera, Crown, Check } from "lucide-react";
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
  const bonusScans = profile?.bonus_scans || 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="px-5 pt-14 max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <h1 className="text-display">Profile</h1>
          <button
            onClick={() => navigate("/settings")}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center pressable"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="premium-card p-6 text-center mb-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h2 className="text-section">{userName}</h2>
          <p className="text-caption">{profile?.email}</p>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <div className="stats-block flex-1">
              <div className="text-xl text-number">{totalMeals || 0}</div>
              <div className="text-caption">Meals Logged</div>
            </div>
            <div className="stats-block flex-1">
              <div className="text-xl text-number">14</div>
              <div className="text-caption">Day Streak</div>
            </div>
          </div>

          {/* Bonus Scans Badge */}
          {bonusScans > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
              <Camera className="w-4 h-4" />
              {bonusScans} Bonus Scans
            </div>
          )}
        </motion.div>

        {/* Premium Subscription Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="mb-4"
        >
          {profile?.is_premium ? (
            <div className="premium-card p-5 bg-gradient-to-r from-accent/10 to-accent/5 border-accent/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[15px] text-foreground">Premium Member</h3>
                  <p className="text-caption">Unlimited scans & insights</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ) : (
            <div className="premium-card p-6 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <Crown className="w-7 h-7 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[20px] font-semibold mb-1">LooKai Premium</h3>
                    <p className="text-[13px] text-muted-foreground">Unlock all features</p>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-5">
                  {["Unlimited food scans", "Weekly insights & trends", "Custom calorie goals"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-[14px]">
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-end gap-3 mb-5">
                  <div className="text-[32px] font-bold text-foreground leading-none">₹49</div>
                  <div className="text-[15px] text-muted-foreground mb-1">/month</div>
                </div>

                <Button className="w-full h-14 rounded-full bg-accent hover:bg-accent/90 text-white font-semibold text-[15px]">
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Daily Goal */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="premium-card p-5 mb-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
              <Target className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-[15px]">Daily Calorie Goal</h3>
              {isEditingGoal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={calorieGoal}
                    onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 2000)}
                    className="w-24 h-9 bg-secondary rounded-xl px-3 text-sm font-medium focus:outline-none"
                    autoFocus
                  />
                  <Button size="sm" onClick={() => updateGoalMutation.mutate()} className="h-9 rounded-xl">
                    Save
                  </Button>
                </div>
              ) : (
                <p className="text-caption">{calorieGoal.toLocaleString()} calories</p>
              )}
            </div>
            <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="pressable">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="premium-card overflow-hidden mb-4"
        >
          <button onClick={() => navigate("/settings")} className="w-full p-4 flex items-center gap-4 border-b border-border pressable">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium text-[15px]">Settings</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>

          <button onClick={() => navigate("/scan")} className="w-full p-4 flex items-center gap-4 pressable">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Camera className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="flex-1 text-left font-medium text-[15px]">Scan Food</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={handleSignOut}
          className="w-full premium-card p-4 flex items-center justify-center gap-2 text-destructive pressable"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </motion.button>

        <p className="text-center text-caption pt-6">LooKai v1.0.4</p>
      </div>

      <MobileNav />
    </div>
  );
}
