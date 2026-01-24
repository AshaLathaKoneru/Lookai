import { Home, Calendar, Camera, Heart, User } from "lucide-react";
import { NavLink } from "./NavLink";

export const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="mx-auto max-w-md">
        <div className="flex justify-around items-center h-20 px-2 pb-2">
          <NavLink
            to="/"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-4 py-2"
            activeClassName="text-foreground"
          >
            <Home className="h-5 w-5" />
            <span className="text-[11px] font-medium">Home</span>
          </NavLink>

          <NavLink
            to="/meal-plan"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-4 py-2"
            activeClassName="text-foreground"
          >
            <Calendar className="h-5 w-5" />
            <span className="text-[11px] font-medium">Plan</span>
          </NavLink>

          <NavLink
            to="/scan"
            className="flex flex-col items-center justify-center -mt-5"
            activeClassName=""
          >
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary pressable">
              <Camera className="h-6 w-6 text-primary-foreground" />
            </div>
          </NavLink>
          
          <NavLink
            to="/favorites"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-4 py-2"
            activeClassName="text-foreground"
          >
            <Heart className="h-5 w-5" />
            <span className="text-[11px] font-medium">Saved</span>
          </NavLink>
          
          <NavLink
            to="/profile"
            className="flex flex-col items-center gap-1 text-muted-foreground transition-colors px-4 py-2"
            activeClassName="text-foreground"
          >
            <User className="h-5 w-5" />
            <span className="text-[11px] font-medium">Profile</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
