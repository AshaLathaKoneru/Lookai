import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MobileNav } from "@/components/MobileNav";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Insights() {
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

  if (!profile?.is_premium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
        <div className="container mx-auto p-4 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-1">Insights</h1>
            <p className="text-muted-foreground">Premium Feature</p>
          </div>

          <Card className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-warning" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Upgrade to LooKai Premium to unlock weekly insights, advanced analytics, and more!
            </p>
            <div className="bg-gradient-to-r from-warning/10 to-primary/10 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-warning" />
                <h3 className="text-lg font-semibold">LooKai Premium</h3>
              </div>
              <div className="text-3xl font-bold mb-2">₹49/month</div>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Unlimited scans</li>
                <li>✓ Weekly insights & charts</li>
                <li>✓ Custom calorie goals</li>
                <li>✓ Advanced analytics</li>
              </ul>
            </div>
            <Button className="w-full">
              Upgrade to Premium
            </Button>
          </Card>
        </div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Insights</h1>
          <p className="text-muted-foreground">Your weekly nutrition trends</p>
        </div>

        <Card className="p-6 mb-4">
          <h3 className="font-semibold mb-4">Weekly Summary</h3>
          <p className="text-muted-foreground text-center py-8">
            Charts and analytics coming soon...
          </p>
        </Card>
      </div>
      <MobileNav />
    </div>
  );
}