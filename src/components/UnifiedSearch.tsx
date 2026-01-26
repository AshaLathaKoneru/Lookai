import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2, Sparkles, UtensilsCrossed, Apple, ArrowRight } from "lucide-react";
import { searchFoods, FoodItem } from "@/data/foodDatabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface UnifiedSearchProps {
  onFoodSelect?: (food: FoodItem) => void;
  onRecipeSearch?: (query: string) => void;
  onAIQuestion?: (question: string) => void;
  isRecipeSearching?: boolean;
}

type SearchIntent = "food" | "recipe" | "ai" | null;

export const UnifiedSearch = ({ 
  onFoodSelect, 
  onRecipeSearch, 
  onAIQuestion,
  isRecipeSearching = false 
}: UnifiedSearchProps) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [intent, setIntent] = useState<SearchIntent>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Detect intent from query
  const detectedIntent = useMemo((): SearchIntent => {
    if (!query.trim()) return null;
    
    const lowerQuery = query.toLowerCase().trim();
    
    // AI question patterns
    const aiPatterns = [
      /^(what|how|why|which|can|should|is|are|do|does|best|top|recommend|suggest|help|tell me|explain)/i,
      /\?$/,
      /^(i want|i need|give me|show me)/i,
    ];
    
    // Recipe patterns
    const recipePatterns = [
      /recipe/i,
      /how to (make|cook|prepare|bake)/i,
      /^(make|cook|prepare|bake)/i,
    ];
    
    // Check for recipe intent first
    if (recipePatterns.some(p => p.test(lowerQuery))) {
      return "recipe";
    }
    
    // Check for AI question
    if (aiPatterns.some(p => p.test(lowerQuery))) {
      return "ai";
    }
    
    // Check if it's a specific food lookup (calories, nutrition)
    if (/calorie|kcal|nutrition|protein|carb|fat/i.test(lowerQuery)) {
      return "food";
    }
    
    // Default to food search for short queries
    if (lowerQuery.length >= 2) {
      return "food";
    }
    
    return null;
  }, [query]);

  // Food search results
  const foodResults = useMemo(() => {
    if (query.length < 2 || detectedIntent === "ai") return [];
    return searchFoods(query).slice(0, 5);
  }, [query, detectedIntent]);

  const handleSelect = (food: FoodItem) => {
    onFoodSelect?.(food);
    setQuery("");
    setShowResults(false);
  };

  const handleAction = () => {
    if (!query.trim()) return;
    
    if (detectedIntent === "ai") {
      onAIQuestion?.(query.trim());
      setQuery("");
      setShowResults(false);
    } else if (detectedIntent === "recipe" || (foodResults.length === 0 && query.length >= 2)) {
      onRecipeSearch?.(query.trim());
      setQuery("");
      setShowResults(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fruit: "bg-orange-100 text-orange-700",
      vegetable: "bg-green-100 text-green-700",
      protein: "bg-red-100 text-red-700",
      dairy: "bg-blue-100 text-blue-700",
      grain: "bg-amber-100 text-amber-700",
      staple: "bg-amber-100 text-amber-700",
      snack: "bg-purple-100 text-purple-700",
      dessert: "bg-pink-100 text-pink-700",
      meal: "bg-indigo-100 text-indigo-700",
      drink: "bg-cyan-100 text-cyan-700",
      pulse: "bg-yellow-100 text-yellow-700",
      bread: "bg-orange-100 text-orange-700",
      breakfast: "bg-yellow-100 text-yellow-700",
    };
    return colors[category] || "bg-secondary text-muted-foreground";
  };

  const getIntentIcon = () => {
    switch (detectedIntent) {
      case "ai": return <Sparkles className="w-4 h-4 text-accent" />;
      case "recipe": return <UtensilsCrossed className="w-4 h-4 text-accent" />;
      case "food": return <Apple className="w-4 h-4 text-accent" />;
      default: return null;
    }
  };

  const getActionLabel = () => {
    switch (detectedIntent) {
      case "ai": return "Ask AI";
      case "recipe": return "Search Recipes";
      default: return "Search";
    }
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleAction();
            }
          }}
          placeholder="Search foods, recipes, or ask a question..."
          className="w-full h-14 bg-white border border-border rounded-2xl pl-12 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
        
        {/* Intent indicator & action button */}
        {query.trim() && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {detectedIntent && getIntentIcon()}
            {(detectedIntent === "ai" || detectedIntent === "recipe" || (query.length >= 2 && foodResults.length === 0)) && (
              <Button
                onClick={handleAction}
                disabled={isRecipeSearching}
                size="sm"
                className="h-9 px-3 rounded-xl text-xs"
              >
                {isRecipeSearching ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    {getActionLabel()}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            )}
            {!detectedIntent && query && (
              <button 
                onClick={() => { setQuery(""); setShowResults(false); }}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && query.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-xl z-50 max-h-80 overflow-y-auto"
          >
            {/* Food Results */}
            {foodResults.length > 0 && (
              <>
                <div className="px-4 py-2 border-b border-border bg-secondary/30">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Apple className="w-3 h-3" />
                    Foods
                  </span>
                </div>
                {foodResults.map((food, i) => (
                  <motion.button
                    key={`${food.name}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => handleSelect(food)}
                    className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-foreground capitalize">{food.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryColor(food.category)}`}>
                          {food.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">{food.region}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-semibold text-accent">{food.kcalPerGram}</span>
                      <span className="text-xs text-muted-foreground ml-1">kcal/g</span>
                    </div>
                  </motion.button>
                ))}
              </>
            )}

            {/* Quick Actions */}
            {query.length >= 2 && (
              <div className="border-t border-border">
                {detectedIntent === "ai" && (
                  <button
                    onClick={handleAction}
                    className="w-full p-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Ask Nutrition AI</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">"{query}"</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                
                {(detectedIntent === "recipe" || (foodResults.length === 0 && detectedIntent !== "ai")) && (
                  <button
                    onClick={() => onRecipeSearch?.(query.trim())}
                    className="w-full p-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Search Recipes</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">Find recipes for "{query}"</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}

                {foodResults.length > 0 && detectedIntent !== "ai" && (
                  <button
                    onClick={() => onRecipeSearch?.(query.trim())}
                    className="w-full p-3 flex items-center gap-3 hover:bg-accent/10 transition-colors text-left border-t border-border"
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      <UtensilsCrossed className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Search recipes for "{query}" instead</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}

            {/* No Results */}
            {foodResults.length === 0 && detectedIntent !== "ai" && detectedIntent !== "recipe" && (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground">No foods found for "{query}"</p>
                <p className="text-xs text-muted-foreground mt-1">Try searching for recipes or ask the AI</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};
