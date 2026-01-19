import { useMemo, useState } from "react";
import { MobileNav } from "@/components/MobileNav";
import { CameraPermissionHelpDialog } from "@/components/CameraPermissionHelpDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, HelpCircle, Info, Upload, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Scan() {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [permissionHelpOpen, setPermissionHelpOpen] = useState(false);
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
    // Reset input so selecting the same photo again still triggers onChange (common on mobile)
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

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage) throw new Error("No image selected");
      if (!canScan) throw new Error("Daily scan limit reached");

      setAnalyzing(true);

      // Increment scan usage
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

      // Call AI analysis function
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
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />

      <CameraPermissionHelpDialog
        open={permissionHelpOpen}
        onOpenChange={setPermissionHelpOpen}
      />

      <div className="container mx-auto p-4 max-w-md relative z-10">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full glass-panel flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="leading-tight">
              <div className="text-[11px] tracking-[0.18em] text-muted-foreground">SCAN</div>
              <div className="text-sm font-semibold">LooKai</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="glass-panel h-10 w-10 rounded-full p-0"
              onClick={() => setPermissionHelpOpen(true)}
              aria-label="Camera permission help"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs tracking-wide">
                {profile?.is_premium ? "UNLIMITED" : `${scansLeft} LEFT`}
              </span>
            </div>
          </div>
        </header>

        {isMobile && (
          <Card className="glass-panel p-4 mb-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">
                  If the camera doesn’t open, use{" "}
                  <span className="font-medium text-foreground">Upload</span> and pick{" "}
                  <span className="font-medium text-foreground">Camera</span> from your gallery options.
                </p>
                <p>
                  If you previously blocked access, enable camera permission for your browser in your phone settings.
                </p>
              </div>
            </div>
          </Card>
        )}

        {!canScan && (
          <Card className="glass-panel p-4 mb-4 border-warning">
            <p className="text-sm text-warning">
              Daily scan limit reached. Upgrade to Premium for unlimited scans!
            </p>
          </Card>
        )}

        {!preview ? (
          <div className="space-y-4">
            <div className="glass-panel rounded-[32px] overflow-hidden relative">
              <div className="relative aspect-[3/4]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background/70" />
                <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,hsl(0_0%_100%_/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(0_0%_100%_/0.05)_1px,transparent_1px)] [background-size:42px_42px]" />

                <div className="pointer-events-none absolute left-6 top-6 h-10 w-10 border-l-2 border-t-2 border-primary/80 rounded-tl-lg" />
                <div className="pointer-events-none absolute right-6 top-6 h-10 w-10 border-r-2 border-t-2 border-primary/80 rounded-tr-lg" />
                <div className="pointer-events-none absolute left-6 bottom-6 h-10 w-10 border-l-2 border-b-2 border-primary/80 rounded-bl-lg" />
                <div className="pointer-events-none absolute right-6 bottom-6 h-10 w-10 border-r-2 border-b-2 border-primary/80 rounded-br-lg" />

                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="text-3xl font-bold tracking-tight">Scanning your vibe…</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Hold steady specifically on the food item.
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="glass-panel rounded-full p-1 flex items-center gap-1">
                      <label
                        htmlFor="camera-input"
                        className="cursor-pointer select-none rounded-full bg-primary/20 px-4 py-2 text-xs font-semibold tracking-wide text-primary"
                      >
                        SCAN
                      </label>
                      <label
                        htmlFor="upload-input"
                        className="cursor-pointer select-none rounded-full px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground"
                      >
                        UPLOAD
                      </label>
                    </div>

                    <div className="glass-panel rounded-full px-4 py-2 text-xs tracking-[0.18em] text-primary">
                      READY
                    </div>
                  </div>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
                id="camera-input"
                disabled={!canScan}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="upload-input"
                disabled={!canScan}
              />
            </div>

            <div className="flex items-center justify-center gap-6 pt-2">
              <Button asChild disabled={!canScan} className="h-20 w-20 rounded-full p-0 neon-fab">
                <label
                  htmlFor="camera-input"
                  className="cursor-pointer h-full w-full flex items-center justify-center"
                >
                  <Camera className="h-7 w-7" />
                </label>
              </Button>

              <Button variant="outline" asChild disabled={!canScan} className="h-14 rounded-full px-6 glass-panel">
                <label htmlFor="upload-input" className="cursor-pointer flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload
                </label>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="glass-panel rounded-[32px] overflow-hidden relative">
              <div className="relative">
                <img
                  src={preview}
                  alt="Meal preview"
                  loading="lazy"
                  className="w-full h-[52vh] object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

                {analyzing && (
                  <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex flex-col items-center justify-center px-6 text-center">
                    <div className="text-4xl font-bold tracking-[0.14em] text-foreground/70">
                      ANALYZING VIBES…
                    </div>
                    <div className="mt-2 text-xs tracking-[0.22em] text-muted-foreground">
                      AI PROCESSING // NEURAL NET ACTIVE
                    </div>

                    <div className="mt-8 w-full max-w-sm space-y-3">
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

              <div className="p-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setPreview(null);
                      setSelectedImage(null);
                    }}
                    variant="outline"
                    className="flex-1 glass-panel"
                    disabled={analyzing}
                  >
                    Retake
                  </Button>

                  <Button
                    onClick={() => analyzeMutation.mutate()}
                    disabled={analyzing}
                    className="flex-1 neon-fab"
                  >
                    {analyzing ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="shimmer h-4 w-16 rounded-full" />
                        Analyzing
                      </span>
                    ) : (
                      "Analyze Meal"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}
