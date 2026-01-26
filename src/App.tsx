import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Log from "./pages/Log";
import Scan from "./pages/Scan";
import MealPreview from "./pages/MealPreview";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Onboarding from "./pages/Onboarding";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkOnboardingStatus();
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkOnboardingStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Listen for localStorage changes (when onboarding completes)
  useEffect(() => {
    const checkOnboarding = () => {
      const onboardingComplete = localStorage.getItem("lookai_onboarding_complete");
      setNeedsOnboarding(!onboardingComplete);
    };

    // Check immediately
    if (session) {
      checkOnboarding();
    }

    // Listen for storage events (for cross-tab sync)
    window.addEventListener("storage", checkOnboarding);

    // Also listen for custom event for same-tab updates
    window.addEventListener("onboarding-complete", checkOnboarding);

    return () => {
      window.removeEventListener("storage", checkOnboarding);
      window.removeEventListener("onboarding-complete", checkOnboarding);
    };
  }, [session]);

  const checkOnboardingStatus = () => {
    const onboardingComplete = localStorage.getItem("lookai_onboarding_complete");
    setNeedsOnboarding(!onboardingComplete);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {!session ? (
              <>
                <Route path="/auth" element={<Auth />} />
                <Route path="*" element={<Navigate to="/auth" replace />} />
              </>
            ) : needsOnboarding ? (
              <>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="*" element={<Navigate to="/onboarding" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/log" element={<Log />} />
                <Route path="/scan" element={<Scan />} />
                <Route path="/meal-preview" element={<MealPreview />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/onboarding" element={<Navigate to="/" replace />} />
                <Route path="/auth" element={<Navigate to="/" replace />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
