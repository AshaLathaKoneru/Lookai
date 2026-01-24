import { Home, Grid3X3, Camera, Heart, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { motion } from "framer-motion";

export const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="mx-auto max-w-md">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex justify-around items-center h-20 px-2">
            <NavLink
              to="/"
              className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground px-3 py-2"
              activeClassName="text-foreground"
            >
              <Home className="h-6 w-6" />
              <span className="text-[10px] font-medium">Home</span>
            </NavLink>

            <NavLink
              to="/log"
              className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground px-3 py-2"
              activeClassName="text-foreground"
            >
              <Grid3X3 className="h-6 w-6" />
              <span className="text-[10px] font-medium">Categories</span>
            </NavLink>

            <NavLink
              to="/scan"
              className="flex flex-col items-center justify-center -mt-4"
              activeClassName=""
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-lg">
                <Camera className="h-6 w-6 text-primary-foreground" />
              </div>
            </NavLink>
            
            <NavLink
              to="/insights"
              className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground px-3 py-2"
              activeClassName="text-foreground"
            >
              <Heart className="h-6 w-6" />
              <span className="text-[10px] font-medium">Favorites</span>
            </NavLink>
            
            <NavLink
              to="/profile"
              className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground px-3 py-2"
              activeClassName="text-foreground"
            >
              <User className="h-6 w-6" />
              <span className="text-[10px] font-medium">Profile</span>
            </NavLink>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};
