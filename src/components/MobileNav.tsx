import { Home, BookOpen, Camera, BarChart3, User } from "lucide-react";
import { NavLink } from "./NavLink";
import { motion } from "framer-motion";

export const MobileNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md px-4 pb-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10"
        >
          <div className="flex justify-around items-center h-16 px-2">
            <NavLink
              to="/"
              className="flex flex-col items-center gap-1 text-white/40 transition-colors hover:text-white/70 px-3 py-2"
              activeClassName="text-[#CCFF00]"
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide">Home</span>
            </NavLink>

            <NavLink
              to="/log"
              className="flex flex-col items-center gap-1 text-white/40 transition-colors hover:text-white/70 px-3 py-2"
              activeClassName="text-[#CCFF00]"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide">Log</span>
            </NavLink>

            <NavLink
              to="/scan"
              className="flex flex-col items-center gap-1 px-3 py-2"
              activeClassName=""
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#CCFF00] -mt-8 shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                <Camera className="h-6 w-6 text-black" />
              </div>
            </NavLink>
            
            <NavLink
              to="/insights"
              className="flex flex-col items-center gap-1 text-white/40 transition-colors hover:text-white/70 px-3 py-2"
              activeClassName="text-[#CCFF00]"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide">Insights</span>
            </NavLink>
            
            <NavLink
              to="/profile"
              className="flex flex-col items-center gap-1 text-white/40 transition-colors hover:text-white/70 px-3 py-2"
              activeClassName="text-[#CCFF00]"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide">Profile</span>
            </NavLink>
          </div>
        </motion.div>
      </div>
    </nav>
  );
};