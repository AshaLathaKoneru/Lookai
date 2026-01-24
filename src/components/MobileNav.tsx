import { Home, BookOpen, Camera, Heart, User } from "lucide-react";
import { NavLink } from "./NavLink";

export const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-md">
        <div className="relative flex justify-around items-center h-[72px] px-6 bg-white rounded-[28px] border border-border shadow-lg">
          {/* Home */}
          <NavLink
            to="/"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-3 py-2"
            activeClassName="text-accent"
          >
            <Home className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Home</span>
          </NavLink>

          {/* Log */}
          <NavLink
            to="/log"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-3 py-2"
            activeClassName="text-accent"
          >
            <BookOpen className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Log</span>
          </NavLink>

          {/* Scan - Center FAB */}
          <NavLink
            to="/scan"
            className="flex flex-col items-center justify-center -mt-8"
            activeClassName=""
          >
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent shadow-[0_0_20px_rgba(27,196,125,0.4)] pressable">
              <Camera className="h-6 w-6 text-white" strokeWidth={2} />
            </div>
          </NavLink>
          
          {/* Favorites */}
          <NavLink
            to="/favorites"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-3 py-2"
            activeClassName="text-accent"
          >
            <Heart className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Saved</span>
          </NavLink>
          
          {/* Profile */}
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-3 py-2"
            activeClassName="text-accent"
          >
            <User className="h-5 w-5" strokeWidth={1.5} />
            <span className="text-[10px] font-medium">Profile</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
