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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 pt-12">
          <button 
            onClick={() => setShowAuthForm(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome to LooKai</h1>
              <p className="text-muted-foreground">Sign in to continue</p>
            </div>
            
            <div className="soft-card p-6">
              <SupabaseAuth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "hsl(0 0% 15%)",
                        brandAccent: "hsl(0 0% 20%)",
                        inputBackground: "hsl(30 20% 97%)",
                        inputBorder: "hsl(30 15% 90%)",
                        inputText: "hsl(0 0% 10%)",
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
      {/* Hero Image Section */}
      <div className="relative h-[55vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=800&auto=format&fit=crop"
          alt="Fresh healthy food"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      {/* Content Section */}
      <div className="flex-1 flex flex-col px-6 -mt-16 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col"
        >
          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight mb-3">
              Your Personal{" "}
              <span className="text-accent">Food AI</span>{" "}
              Assistant
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              I can suggest recipes, track calories, plan meals, and provide personalized nutrition advice daily.
            </p>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* CTA Buttons */}
          <div className="space-y-3 pb-10">
            <Button
              onClick={() => setShowAuthForm(true)}
              className="w-full h-14 rounded-full text-base font-semibold"
            >
              Your Assistant
            </Button>
            
            <button
              onClick={() => setShowAuthForm(true)}
              className="w-full text-center py-3 text-muted-foreground text-sm"
            >
              Already have an account?{" "}
              <span className="text-foreground font-medium">Login</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
