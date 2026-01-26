import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useScanLimit() {
    // Get user profile to check premium status
    const { data: profile } = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error) throw error;
            return data;
        },
    });

    // Get today's scan count
    const { data: scanUsage } = useQuery({
        queryKey: ["scan-usage", "today"],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const today = format(new Date(), "yyyy-MM-dd");
            const { data, error } = await supabase
                .from("scan_usage")
                .select("scan_count")
                .eq("user_id", user.id)
                .eq("scan_date", today)
                .single();

            if (error && error.code !== "PGRST116") throw error; // Ignore not found error
            return data;
        },
    });

    const isPremium = profile?.is_premium || false;
    const todayScans = scanUsage?.scan_count || 0;
    const canScan = isPremium || todayScans < 5;
    const scansRemaining = isPremium ? Infinity : Math.max(0, 5 - todayScans);

    return {
        canScan,
        scansRemaining,
        todayScans,
        isPremium,
        isLoading: !profile,
    };
}
