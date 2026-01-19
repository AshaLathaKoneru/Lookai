import { Home, BookOpen, Camera, BarChart3, User } from "lucide-react";
import { NavLink } from "./NavLink";

export const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/30 backdrop-blur-2xl">
      <div className="mx-auto max-w-2xl px-3 pb-3">
        <div className="glass-panel rounded-[28px]">
          <div className="flex justify-around items-center h-16 px-4">
        <NavLink
          to="/"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          activeClassName="text-foreground"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/log"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          activeClassName="text-foreground"
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-xs font-medium">Log</span>
        </NavLink>

        <NavLink
          to="/scan"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          activeClassName="text-foreground"
        >
          <div className="neon-fab flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground -mt-6">
            <Camera className="h-6 w-6" />
          </div>
          <span className="text-xs font-medium mt-1">Scan</span>
        </NavLink>
        
        <NavLink
          to="/insights"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
          activeClassName="text-primary"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs font-medium">Insights</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
          activeClassName="text-primary"
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profile</span>
        </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};