import { useEffect, useMemo, useRef, useState } from "react";
import { MobileNav } from "@/components/MobileNav";
import { CameraPermissionHelpDialog } from "@/components/CameraPermissionHelpDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Settings, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

export default function Scan() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [permissionHelpOpen, setPermissionHelpOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"scan" | "upload">("scan");
  const [pickerArmed, setPickerArmed] = useState<null | "camera" | "upload">(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    setPickerArmed(null);

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
    setPickerArmed("camera");
    cameraInputRef.current?.click();
  };

  const openUploadPicker = () => {
    setPickerArmed("upload");
    uploadInputRef.current?.click();
  };

  useEffect(() => {
    if (!pickerArmed) return;
    const t = window.setTimeout(() => setPickerArmed(null), 2000);
    return () => window.clearTimeout(t);
  }, [pickerArmed]);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) throw new Error("No image selected");
      if (!canScan) throw new Error("Daily scan limit reached");

      setAnalyzing(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
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
    <div className="min-h-screen bg-background flex flex-col">
      <CameraPermissionHelpDialog
        open={permissionHelpOpen}
        onOpenChange={setPermissionHelpOpen}
      />

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
        /* ============ SCAN VIEW ============ */
        <div className="flex-1 flex flex-col relative">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
            <button
              onClick={() => navigate("/")}
              className="w-12 h-12 rounded-full bg-muted/80 backdrop-blur-md flex items-center justify-center pressable"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-12 h-12 rounded-full bg-muted/80 backdrop-blur-md flex items-center justify-center pressable">
              <Zap className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Scan area with focus brackets */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
            
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(to_right,hsl(0_0%_100%_/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%_/0.03)_1px,transparent_1px)] [background-size:48px_48px]" />

            {/* Focus bracket container */}
            <div className="relative w-[85%] aspect-square max-w-sm">
              {/* Corner brackets */}
              <div className="absolute left-0 top-0 h-16 w-16 border-l-[3px] border-t-[3px] border-primary rounded-tl-2xl" />
              <div className="absolute right-0 top-0 h-16 w-16 border-r-[3px] border-t-[3px] border-primary rounded-tr-2xl" />
              <div className="absolute left-0 bottom-0 h-16 w-16 border-l-[3px] border-b-[3px] border-primary rounded-bl-2xl" />
              <div className="absolute right-0 bottom-0 h-16 w-16 border-r-[3px] border-b-[3px] border-primary rounded-br-2xl" />

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
              </div>

              {/* Scan line */}
              <div className="absolute left-4 right-4 top-[40%] h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-60" />

              {/* HEALTHY pill */}
              <div className="absolute right-0 top-[35%] chip flex items-center gap-1.5 px-3 py-1.5">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-semibold tracking-wide">HEALTHY</span>
              </div>
            </div>
          </div>

          {/* Bottom content */}
          <div className="relative z-10 px-6 pb-8">
            {/* Text */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Scanning your vibe...</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Hold steady specifically on the food item.
              </p>
            </div>

            {/* Segmented toggle */}
            <div className="flex justify-center mb-8">
              <div className="glass-panel rounded-full p-1 flex items-center">
                <button
                  onClick={() => {
                    setActiveTab("scan");
                    openCameraPicker();
                  }}
                  disabled={!canScan}
                  className={`h-10 px-6 rounded-full text-sm font-semibold tracking-wide transition-all ${
                    activeTab === "scan"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
                  className={`h-10 px-6 rounded-full text-sm font-semibold tracking-wide transition-all ${
                    activeTab === "upload"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Bottom controls row */}
            <div className="flex items-center justify-between px-4">
              {/* Left thumbnail placeholder */}
              <div className="w-14 h-14 rounded-full bg-muted/50 border border-border/30 overflow-hidden flex items-center justify-center">
                <span className="text-2xl">🥗</span>
              </div>

              {/* Center shutter button */}
              <button
                onClick={openCameraPicker}
                disabled={!canScan}
                className="relative w-20 h-20 pressable"
              >
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                {/* Middle ring */}
                <div className="absolute inset-2 rounded-full border-2 border-primary/50" />
                {/* Inner button */}
                <div className="absolute inset-4 rounded-full bg-primary flex items-center justify-center shadow-[0_0_24px_hsl(var(--primary)/0.5)]">
                  <Camera className="w-6 h-6 text-primary-foreground" />
                </div>
              </button>

              {/* Right settings button */}
              <button className="w-14 h-14 rounded-full bg-muted/50 border border-border/30 flex items-center justify-center pressable">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Scan limit warning */}
            {!canScan && (
              <Card className="glass-panel p-3 mt-4 border-warning/50">
                <p className="text-xs text-warning text-center">
                  Daily limit reached. Upgrade for unlimited scans!
                </p>
              </Card>
            )}

            {/* Scans left indicator */}
            {canScan && !profile?.is_premium && (
              <div className="text-center mt-4">
                <span className="text-xs text-muted-foreground">{scansLeft} scans left today</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ============ PREVIEW / ANALYZING VIEW ============ */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-12 pb-4">
            <button
              onClick={() => {
                setPreview(null);
                setSelectedImage(null);
              }}
              disabled={analyzing}
              className="w-12 h-12 rounded-full bg-muted/80 backdrop-blur-md flex items-center justify-center pressable"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
            <button className="w-12 h-12 rounded-full bg-muted/80 backdrop-blur-md flex items-center justify-center pressable">
              <Zap className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Image preview */}
          <div className="flex-1 relative">
            <img
              src={preview}
              alt="Meal preview"
              className="w-full h-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />

            {/* Analyzing overlay */}
            {analyzing && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex flex-col items-center justify-center px-6">
                <div className="text-3xl font-bold tracking-[0.1em] text-foreground/80 text-center">
                  ANALYZING VIBES…
                </div>
                <div className="mt-2 text-xs tracking-[0.2em] text-muted-foreground">
                  AI PROCESSING // NEURAL NET ACTIVE
                </div>

                <div className="mt-8 w-full max-w-xs space-y-3">
                  <div className="glass-panel rounded-2xl p-4">
                    <div className="shimmer h-3 w-2/3 rounded-full" />
                    <div className="mt-3 shimmer h-3 w-1/2 rounded-full" />
                  </div>
                  <div className="glass-panel rounded-2xl p-4">
                    <div className="shimmer h-3 w-3/4 rounded-full" />
                    <div className="mt-3 shimmer h-3 w-1/3 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom actions */}
          <div className="p-4 pb-8 bg-background">
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setPreview(null);
                  setSelectedImage(null);
                }}
                variant="outline"
                className="flex-1 h-12 glass-panel rounded-full"
                disabled={analyzing}
              >
                Retake
              </Button>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzing}
                className="flex-1 h-12 neon-fab rounded-full"
              >
                {analyzing ? "Analyzing..." : "Analyze Meal"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}