import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Crown, LogOut, User as UserIcon } from "lucide-react";
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

  const [name, setName] = useState(profile?.name || "");
  const [calorieGoal, setCalorieGoal] = useState(profile?.calorie_goal || 2000);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const updates: any = { name };
      
      // Only allow custom calorie goal for premium users
      if (profile?.is_premium) {
        updates.calorie_goal = calorieGoal;
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved",
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Profile</h1>
          <p className="text-muted-foreground">Manage your account</p>
        </div>

        {profile?.is_premium && (
          <Card className="p-4 mb-4 bg-gradient-to-r from-warning/10 to-primary/10 border-warning/20">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-warning" />
              <span className="font-semibold">Premium Member</span>
            </div>
          </Card>
        )}

        <Card className="p-6 mb-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <Label htmlFor="calorie-goal">
                Daily Calorie Goal
                {!profile?.is_premium && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Premium feature)
                  </span>
                )}
              </Label>
              <Input
                id="calorie-goal"
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(parseInt(e.target.value) || 2000)}
                disabled={!profile?.is_premium}
                className={!profile?.is_premium ? "bg-muted" : ""}
              />
              {!profile?.is_premium && (
                <p className="text-xs text-muted-foreground mt-1">
                  Default: 2000 kcal. Upgrade to Premium to customize.
                </p>
              )}
            </div>

            <Button
              onClick={() => updateProfileMutation.mutate()}
              disabled={updateProfileMutation.isPending}
              className="w-full"
            >
              Save Changes
            </Button>
          </div>
        </Card>

        {!profile?.is_premium && (
          <Card className="p-6 mb-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-warning" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Unlock unlimited scans, custom goals, and weekly insights
              </p>
              <div className="text-2xl font-bold mb-4">₹49/month</div>
              <Button className="w-full">
                Upgrade Now
              </Button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </Card>
      </div>
      <MobileNav />
    </div>
  );
}