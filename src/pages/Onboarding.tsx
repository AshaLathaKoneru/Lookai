import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Utensils, Activity, Leaf, Fish, Wheat, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Goal = "weight_loss" | "maintenance" | "muscle_gain";
type Diet = "none" | "vegetarian" | "vegan" | "keto" | "paleo" | "gluten_free";

const goals = [
  { id: "weight_loss" as Goal, label: "Lose Weight", description: "Reduce body fat and get leaner", icon: Target },
  { id: "maintenance" as Goal, label: "Maintain Weight", description: "Keep your current physique", icon: Activity },
  { id: "muscle_gain" as Goal, label: "Build Muscle", description: "Gain strength and muscle mass", icon: Activity },
];

const diets = [
  { id: "none" as Diet, label: "No Preference", icon: Utensils },
  { id: "vegetarian" as Diet, label: "Vegetarian", icon: Leaf },
  { id: "vegan" as Diet, label: "Vegan", icon: Leaf },
  { id: "keto" as Diet, label: "Keto", icon: Fish },
  { id: "paleo" as Diet, label: "Paleo", icon: Fish },
  { id: "gluten_free" as Diet, label: "Gluten Free", icon: Wheat },
];

const calorieDefaults = {
  weight_loss: 1500,
  maintenance: 2000,
  muscle_gain: 2500,
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedDiets, setSelectedDiets] = useState<Diet[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [saving, setSaving] = useState(false);

  const totalSteps = 3;

  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal);
    setCalorieGoal(calorieDefaults[goal]);
  };

  const toggleDiet = (diet: Diet) => {
    if (diet === "none") {
      setSelectedDiets(["none"]);
    } else {
      setSelectedDiets((prev) => {
        const filtered = prev.filter((d) => d !== "none");
        if (filtered.includes(diet)) {
          return filtered.filter((d) => d !== diet);
        }
        return [...filtered, diet];
      });
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Update profile with goals and preferences
      const { error } = await supabase
        .from("profiles")
        .update({
          calorie_goal: calorieGoal,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      // Store that onboarding is complete in localStorage
      localStorage.setItem("lookai_onboarding_complete", "true");

      // Dispatch custom event to notify App.tsx
      window.dispatchEvent(new Event("onboarding-complete"));

      toast({
        title: "Welcome to LooKai!",
        description: "Your preferences have been saved.",
      });

      // Small delay to ensure state updates before navigation
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return selectedGoal !== null;
    if (step === 2) return selectedDiets.length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar */}
      <div className="p-4 pt-12">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Step {step} of {totalSteps}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <h1 className="text-2xl font-bold mb-2">What's your goal?</h1>
              <p className="text-muted-foreground mb-8">
                This helps us personalize your calorie targets
              </p>

              <div className="space-y-4">
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => handleGoalSelect(goal.id)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                        selectedGoal === goal.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedGoal === goal.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{goal.label}</h3>
                        <p className="text-sm text-muted-foreground">
                          {goal.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <h1 className="text-2xl font-bold mb-2">Dietary preferences</h1>
              <p className="text-muted-foreground mb-8">
                Select any that apply to you
              </p>

              <div className="grid grid-cols-2 gap-3">
                {diets.map((diet) => {
                  const Icon = diet.icon;
                  return (
                    <button
                      key={diet.id}
                      onClick={() => toggleDiet(diet.id)}
                      className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                        selectedDiets.includes(diet.id)
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedDiets.includes(diet.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-sm">{diet.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <h1 className="text-2xl font-bold mb-2">Daily calorie target</h1>
              <p className="text-muted-foreground mb-8">
                Based on your goal, we recommend {calorieDefaults[selectedGoal || "maintenance"]} calories
              </p>

              <div className="bg-card rounded-3xl p-6 shadow-soft mb-6">
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold">{calorieGoal}</span>
                  <span className="text-xl text-muted-foreground ml-2">kcal/day</span>
                </div>

                <input
                  type="range"
                  min="1000"
                  max="4000"
                  step="50"
                  value={calorieGoal}
                  onChange={(e) => setCalorieGoal(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />

                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                  <span>1000</span>
                  <span>4000</span>
                </div>
              </div>

              <div className="bg-accent/10 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This is a starting point. You can adjust your calorie goal anytime in Settings.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 space-y-3">
        {step === totalSteps ? (
          <Button
            onClick={handleComplete}
            disabled={saving}
            className="w-full h-14 rounded-full text-base font-semibold"
          >
            {saving ? "Saving..." : "Get Started"}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-14 rounded-full text-base font-semibold"
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        )}

        {step > 1 && (
          <button
            onClick={handleBack}
            className="w-full py-3 text-muted-foreground text-sm"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
