import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface CalorieRingProps {
  consumed: number;
  goal: number;
}

export const CalorieRing = ({ consumed, goal }: CalorieRingProps) => {
  const remaining = Math.max(0, goal - consumed);
  const percentage = Math.min(100, (consumed / goal) * 100);
  
  // Ring calculations
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center">
      {/* SVG Ring */}
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
      >
        {/* Background Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          className="opacity-60"
        />
        
        {/* Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progressOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            filter: "drop-shadow(0 0 8px hsl(var(--accent) / 0.4))",
          }}
        />
      </svg>
      
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1 mb-1">
          <Zap className="w-4 h-4 text-muted-foreground" />
        </div>
        <motion.span 
          className="text-4xl font-bold text-foreground"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {remaining.toLocaleString()}
        </motion.span>
        <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase mt-1">
          kcal left
        </span>
        <div className="mt-2 px-3 py-1 rounded-full bg-secondary/80 text-[10px] font-medium text-muted-foreground">
          {percentage.toFixed(0)}% of daily goal
        </div>
      </div>
    </div>
  );
};
