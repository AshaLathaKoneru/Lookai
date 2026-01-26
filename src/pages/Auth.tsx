import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Auth() {
  const navigate = useNavigate();
  const [showAuthForm, setShowAuthForm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="p-5 pt-14">
          <button
            onClick={() => setShowAuthForm(false)}
            className="text-muted-foreground text-sm font-medium"
          >
            ← Back
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <img
                src="/lookai-logo.png"
                alt="LooKai"
                className="h-12 w-auto mx-auto mb-6"
              />
              <h1 className="text-display mb-2">Welcome back</h1>
              <p className="text-caption">Sign in to continue</p>
            </div>

            <div className="premium-card p-6">
              <SupabaseAuth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "hsl(0 0% 9%)",
                        brandAccent: "hsl(0 0% 15%)",
                        inputBackground: "hsl(40 20% 96%)",
                        inputBorder: "hsl(0 0% 90%)",
                        inputText: "hsl(0 0% 4%)",
                        inputPlaceholder: "hsl(0 0% 45%)",
                      },
                      radii: {
                        borderRadiusButton: "9999px",
                        inputBorderRadius: "12px",
                      },
                    },
                  },
                  className: {
                    button: "!rounded-full !h-12 !font-semibold",
                    input: "!rounded-xl !h-12",
                    label: "!text-foreground !font-medium",
                  },
                }}
                providers={[]}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Image */}
      <div className="relative h-[55vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop"
          alt="Fresh healthy food"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/lookai-logo.png"
              alt="LooKai"
              className="h-16 w-auto"
            />
          </div>

          <div className="mb-8">
            <h1 className="text-[28px] font-bold leading-tight mb-3 tracking-tight">
              Your Personal{" "}
              <span className="text-accent">Nutrition</span>{" "}
              Assistant
            </h1>
            <p className="text-muted-foreground text-body leading-relaxed">
              Track meals, discover recipes, and get personalized nutrition insights.
            </p>
          </div>

          <div className="flex-1" />

          <div className="space-y-3 pb-10">
            <Button
              onClick={() => setShowAuthForm(true)}
              className="w-full h-14 rounded-full text-[15px] font-semibold"
            >
              Get Started
            </Button>

            <button
              onClick={() => setShowAuthForm(true)}
              className="w-full text-center py-3 text-caption"
            >
              Already have an account?{" "}
              <span className="text-foreground font-medium">Sign in</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
