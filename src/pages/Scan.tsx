import { useState } from "react";
import { MobileNav } from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Upload, Loader2, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Scan() {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
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
      
      const today = new Date().toISOString().split('T')[0];
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const today = new Date().toISOString().split('T')[0];
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

      // Call AI analysis edge function
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background pb-20">
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Scan Meal</h1>
          <p className="text-muted-foreground">
            {profile?.is_premium ? "Unlimited scans" : `${5 - (todayUsage?.scan_count || 0)} scans remaining today`}
          </p>
        </div>

        {isMobile && (
          <Card className="p-4 mb-4">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="mb-1">
                  If the camera doesn’t open, use <span className="font-medium">Upload Photo</span> and pick <span className="font-medium">Camera</span> from your gallery options.
                </p>
                <p>
                  If you previously blocked access, enable camera permission for your browser in your phone settings.
                </p>
              </div>
            </div>
          </Card>
        )}

        {!canScan && (
          <Card className="p-4 mb-4 border-warning bg-warning/5">
            <p className="text-sm text-warning">
              Daily scan limit reached. Upgrade to Premium for unlimited scans!
            </p>
          </Card>
        )}

        {!preview ? (
          <div className="space-y-4">
            <Card className="p-8 border-2 border-dashed">
              <div className="text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Take a Photo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Point your camera at your meal
                </p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="camera-input"
                  disabled={!canScan}
                />
                <Button asChild disabled={!canScan}>
                  <label htmlFor="camera-input" className="cursor-pointer">
                    <Camera className="mr-2 h-4 w-4" />
                    Open Camera
                  </label>
                </Button>
              </div>
            </Card>

            <Card className="p-8 border-2 border-dashed">
              <div className="text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Upload Photo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select an image from your gallery
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="upload-input"
                  disabled={!canScan}
                />
                <Button variant="outline" asChild disabled={!canScan}>
                  <label htmlFor="upload-input" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </label>
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="p-4">
              <img
                src={preview}
                alt="Meal preview"
                loading="lazy"
                className="w-full rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setPreview(null);
                    setSelectedImage(null);
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Retake
                </Button>
                <Button
                  onClick={() => analyzeMutation.mutate()}
                  disabled={analyzing}
                  className="flex-1"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Meal"
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
      <MobileNav />
    </div>
  );
}