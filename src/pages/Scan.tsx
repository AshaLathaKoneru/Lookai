import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Zap, Settings, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function Scan() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"scan" | "upload">("scan");

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      return data;
    },
  });

  const { data: todayUsage } = useQuery({
    queryKey: ["scan-usage", "today"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("scan_usage")
        .select("*")
        .eq("user_id", user.id)
        .eq("scan_date", today)
        .maybeSingle();

      return data;
    },
  });

  const canScan = profile?.is_premium || (todayUsage?.scan_count || 0) < 5;
  const scansLeft = useMemo(
    () => Math.max(0, 5 - (todayUsage?.scan_count || 0)),
    [todayUsage?.scan_count]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Unsupported file",
        description: "Please select an image.",
        variant: "destructive",
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const openCameraPicker = () => {
    cameraInputRef.current?.click();
  };

  const openUploadPicker = () => {
    uploadInputRef.current?.click();
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) throw new Error("No image selected");
      if (!canScan) throw new Error("Daily scan limit reached");

      setAnalyzing(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split("T")[0];
      const currentCount = todayUsage?.scan_count || 0;

      if (todayUsage) {
        await supabase
          .from("scan_usage")
          .update({ scan_count: currentCount + 1 })
          .eq("user_id", user.id)
          .eq("scan_date", today);
      } else {
        await supabase
          .from("scan_usage")
          .insert({ user_id: user.id, scan_date: today, scan_count: 1 });
      }

      const base64 = preview?.split(",")[1];
      const { data, error } = await supabase.functions.invoke("analyze-meal", {
        body: { image: base64 },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Meal Analyzed!",
        description: `Found: ${data.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ["scan-usage"] });
      navigate("/meal-preview", { state: { mealData: data, image: preview } });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setAnalyzing(false);
    },
  });

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canScan}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canScan}
      />

      {!preview ? (
        /* ============ CLEAN SCAN VIEW ============ */
        <div className="flex-1 flex flex-col relative">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-14">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => navigate("/")}
              className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-white/80" />
            </motion.button>
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-11 h-11 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Zap className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>

          {/* Scanner area */}
          <div className="flex-1 relative flex items-center justify-center px-6">
            {/* Focus bracket container */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative w-full aspect-square max-w-xs"
            >
              {/* Corner brackets - top left */}
              <div className="absolute left-0 top-0 h-20 w-20">
                <div className="absolute left-0 top-0 h-full w-[3px] bg-[#CCFF00] rounded-full" />
                <div className="absolute left-0 top-0 w-full h-[3px] bg-[#CCFF00] rounded-full" />
              </div>
              
              {/* Corner brackets - top right */}
              <div className="absolute right-0 top-0 h-20 w-20">
                <div className="absolute right-0 top-0 h-full w-[3px] bg-[#CCFF00] rounded-full" />
                <div className="absolute right-0 top-0 w-full h-[3px] bg-[#CCFF00] rounded-full" />
              </div>
              
              {/* Corner brackets - bottom left */}
              <div className="absolute left-0 bottom-0 h-20 w-20">
                <div className="absolute left-0 bottom-0 h-full w-[3px] bg-[#CCFF00] rounded-full" />
                <div className="absolute left-0 bottom-0 w-full h-[3px] bg-[#CCFF00] rounded-full" />
              </div>
              
              {/* Corner brackets - bottom right */}
              <div className="absolute right-0 bottom-0 h-20 w-20">
                <div className="absolute right-0 bottom-0 h-full w-[3px] bg-[#CCFF00] rounded-full" />
                <div className="absolute right-0 bottom-0 w-full h-[3px] bg-[#CCFF00] rounded-full" />
              </div>

              {/* Animated scanning line */}
              <motion.div
                className="absolute left-6 right-6 h-[2px] rounded-full"
                style={{
                  background: "linear-gradient(90deg, transparent, #CCFF00, transparent)",
                  boxShadow: "0 0 20px #CCFF00, 0 0 40px rgba(204,255,0,0.5)",
                }}
                initial={{ top: "15%" }}
                animate={{ top: ["15%", "85%", "15%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div 
                  className="w-2.5 h-2.5 rounded-full bg-[#CCFF00]"
                  style={{ boxShadow: "0 0 12px #CCFF00, 0 0 24px rgba(204,255,0,0.5)" }}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* HEALTHY badge */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="absolute -right-2 top-[30%] flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10"
              >
                <motion.span 
                  className="w-2 h-2 rounded-full bg-[#CCFF00]"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span className="text-xs font-semibold tracking-wider text-white/90">HEALTHY</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom content */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative z-10 px-6 pb-10"
          >
            {/* Text */}
            <div className="text-center mb-8">
              <h1 
                className="text-2xl font-bold tracking-tight text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Scanning your vibe...
              </h1>
              <p className="text-sm text-white/50 mt-2">
                Hold steady specifically on the food item.
              </p>
            </div>

            {/* Segmented toggle */}
            <div className="flex justify-center mb-10">
              <div className="flex items-center p-1 rounded-full bg-white/5 backdrop-blur-md border border-white/10">
                <button
                  onClick={() => {
                    setActiveTab("scan");
                    openCameraPicker();
                  }}
                  disabled={!canScan}
                  className={`h-10 px-7 rounded-full text-sm font-semibold tracking-wide transition-all ${
                    activeTab === "scan"
                      ? "bg-[#CCFF00] text-black"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  Scan
                </button>
                <button
                  onClick={() => {
                    setActiveTab("upload");
                    openUploadPicker();
                  }}
                  disabled={!canScan}
                  className={`h-10 px-7 rounded-full text-sm font-semibold tracking-wide transition-all ${
                    activeTab === "upload"
                      ? "bg-[#CCFF00] text-black"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Bottom controls row */}
            <div className="flex items-center justify-center gap-8">
              {/* Left - gallery button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={openUploadPicker}
                disabled={!canScan}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <span className="text-2xl">🥗</span>
              </motion.button>

              {/* Center shutter button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={openCameraPicker}
                disabled={!canScan}
                className="relative w-[72px] h-[72px]"
              >
                {/* Outer glow ring */}
                <motion.div 
                  className="absolute inset-0 rounded-full bg-[#CCFF00]/20"
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                {/* Middle ring */}
                <div className="absolute inset-1 rounded-full border-2 border-[#CCFF00]/40" />
                {/* Inner button */}
                <div 
                  className="absolute inset-3 rounded-full bg-[#CCFF00] flex items-center justify-center"
                  style={{ boxShadow: "0 0 24px rgba(204,255,0,0.5)" }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-black">
                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.button>

              {/* Right - settings button */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/settings")}
                className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center"
              >
                <Settings className="w-5 h-5 text-white/50" />
              </motion.button>
            </div>

            {/* Scan limit indicator */}
            {!canScan ? (
              <div className="mt-6 text-center">
                <span className="text-xs text-[#CCFF00]/80 px-3 py-1.5 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20">
                  Daily limit reached • Upgrade for unlimited
                </span>
              </div>
            ) : !profile?.is_premium && (
              <div className="mt-6 text-center">
                <span className="text-xs text-white/40">{scansLeft} scans left today</span>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        /* ============ PREVIEW / ANALYZING VIEW ============ */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-14">
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => {
                setPreview(null);
                setSelectedImage(null);
              }}
              disabled={analyzing}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <X className="w-5 h-5 text-white/80" />
            </motion.button>
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center"
            >
              <Zap className="w-5 h-5 text-white/60" />
            </motion.button>
          </div>

          {/* Image preview */}
          <div className="flex-1 relative">
            <img
              src={preview}
              alt="Meal preview"
              className="w-full h-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />

            {/* Analyzing overlay */}
            {analyzing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center px-6"
              >
                {/* Scanning animation */}
                <div className="relative w-32 h-32 mb-8">
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-[#CCFF00]/30"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-4 rounded-full border-2 border-[#CCFF00]/50"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.3, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  <div className="absolute inset-8 rounded-full bg-[#CCFF00]/10 flex items-center justify-center">
                    <motion.div
                      className="w-4 h-4 rounded-full bg-[#CCFF00]"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{ boxShadow: "0 0 20px #CCFF00" }}
                    />
                  </div>
                </div>

                <h2 
                  className="text-2xl font-bold text-white tracking-tight mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Analyzing...
                </h2>
                <p className="text-sm text-white/50">Identifying nutrients & calories</p>
              </motion.div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="p-5 pb-10 bg-black">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setPreview(null);
                  setSelectedImage(null);
                }}
                variant="outline"
                className="flex-1 h-14 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10"
                disabled={analyzing}
              >
                Retake
              </Button>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzing}
                className="flex-1 h-14 rounded-full bg-[#CCFF00] text-black font-semibold hover:bg-[#CCFF00]/90"
                style={{ boxShadow: "0 0 24px rgba(204,255,0,0.4)" }}
              >
                {analyzing ? "Analyzing..." : "Analyze Meal"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
