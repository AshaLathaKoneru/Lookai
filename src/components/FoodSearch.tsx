import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { searchFoods, FoodItem } from "@/data/foodDatabase";

interface FoodSearchProps {
  onSelect?: (food: FoodItem) => void;
}

export const FoodSearch = ({ onSelect }: FoodSearchProps) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return searchFoods(query);
  }, [query]);

  const handleSelect = (food: FoodItem) => {
    onSelect?.(food);
    setQuery("");
    setShowResults(false);
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

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Search foods (e.g. rice, dal, momo)..."
          className="w-full h-14 bg-white border border-border rounded-2xl pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setShowResults(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center"
          >
            <X className="w-3 h-3 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-xl z-50 max-h-80 overflow-y-auto"
          >
            {results.map((food, i) => (
              <motion.button
                key={`${food.name}-${i}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => handleSelect(food)}
                className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left border-b border-border last:border-0"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-foreground capitalize">{food.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryColor(food.category)}`}>
                      {food.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">{food.region}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-accent">{food.kcalPerGram}</span>
                  <span className="text-xs text-muted-foreground ml-1">kcal/g</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {showResults && query.length >= 2 && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-border shadow-xl z-50 p-6 text-center"
          >
            <p className="text-sm text-muted-foreground">No foods found for "{query}"</p>
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
