import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { motion } from "framer-motion";
import { MobileNav } from "@/components/MobileNav";
import { useMealPlans, MealType } from "@/hooks/useMealPlans";
import { useFavoriteRecipes } from "@/hooks/useFavoriteRecipes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const mealTypes: { id: MealType; label: string; emoji: string }[] = [
  { id: "breakfast", label: "Breakfast", emoji: "🌅" },
  { id: "lunch", label: "Lunch", emoji: "☀️" },
  { id: "dinner", label: "Dinner", emoji: "🌙" },
  { id: "snack", label: "Snack", emoji: "🍿" },
];

export default function MealPlan() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("breakfast");

  const { mealPlans, isLoading, addMealPlan, removeMealPlan, getMealsForDayAndType } = useMealPlans(weekStart);
  const { favorites } = useFavoriteRecipes();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleAddMeal = (recipe: any) => {
    addMealPlan.mutate({
      date: selectedDay,
      mealType: selectedMealType,
      recipeName: recipe.recipe_name,
      recipeImage: recipe.recipe_image,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
    });
    setShowAddModal(false);
  };

  const getDayMeals = (date: Date) => {
    const meals: Record<MealType, any[]> = {
      breakfast: getMealsForDayAndType(date, "breakfast"),
      lunch: getMealsForDayAndType(date, "lunch"),
      dinner: getMealsForDayAndType(date, "dinner"),
      snack: getMealsForDayAndType(date, "snack"),
    };
    return meals;
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="flex items-center gap-4 p-4 pt-12">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-soft"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Meal Plan</h1>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between px-4 pb-3">
          <button
            onClick={() => setWeekStart(subWeeks(weekStart, 1))}
            className="p-2 rounded-full hover:bg-muted"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
          </span>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="p-2 rounded-full hover:bg-muted"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Selector */}
        <div className="flex gap-1 px-4 pb-4 overflow-x-auto">
          {weekDays.map((day) => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 min-w-[50px] py-2 px-1 rounded-xl text-center transition-colors ${
                isSameDay(day, selectedDay)
                  ? "bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted"
              }`}
            >
              <div className="text-xs opacity-70">{format(day, "EEE")}</div>
              <div className="font-semibold">{format(day, "d")}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md">
        <h2 className="font-semibold mb-4">{format(selectedDay, "EEEE, MMMM d")}</h2>

        {/* Meal Sections */}
        <div className="space-y-6">
          {mealTypes.map((mealType) => {
            const meals = getMealsForDayAndType(selectedDay, mealType.id);
            
            return (
              <motion.div
                key={mealType.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2">
                    <span>{mealType.emoji}</span>
                    {mealType.label}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedMealType(mealType.id);
                      setShowAddModal(true);
                    }}
                    className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {meals.length === 0 ? (
                  <div className="soft-card p-4 text-center text-muted-foreground text-sm">
                    No meal planned
                  </div>
                ) : (
                  meals.map((meal) => (
                    <div key={meal.id} className="soft-card p-3 flex items-center gap-3">
                      {meal.recipe_image && (
                        <img
                          src={meal.recipe_image}
                          alt={meal.recipe_name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{meal.recipe_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {meal.calories} cal • P: {meal.protein} C: {meal.carbs}
                        </p>
                      </div>
                      <button
                        onClick={() => removeMealPlan.mutate(meal.id)}
                        className="p-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Meal Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Add {mealTypes.find(m => m.id === selectedMealType)?.label} for {format(selectedDay, "MMM d")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Save some recipes to your favorites first!
                </p>
                <Button onClick={() => { setShowAddModal(false); navigate("/"); }}>
                  Find Recipes
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Choose from your favorite recipes:
                </p>
                <div className="space-y-3">
                  {favorites.map((recipe) => (
                    <button
                      key={recipe.id}
                      onClick={() => handleAddMeal(recipe)}
                      className="w-full soft-card p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <img
                        src={recipe.recipe_image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400"}
                        alt={recipe.recipe_name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{recipe.recipe_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {recipe.calories} cal
                        </p>
                      </div>
                      <Plus className="w-5 h-5 text-primary" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MobileNav />
    </div>
  );
}
