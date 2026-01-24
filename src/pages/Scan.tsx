import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, Image as ImageIcon, Camera, RefreshCw } from "lucide-react";
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraActive(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraActive(true);
          }).catch(err => {
            console.error("Video play error:", err);
            setCameraError("Unable to start video playback");
          });
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError(err.message || "Unable to access camera");
      setCameraActive(false);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPreview(dataUrl);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], "captured-meal.jpg", { type: "image/jpeg" });
        setSelectedImage(file);
      }
    }, "image/jpeg", 0.9);
    
    stopCamera();
  }, [stopCamera]);

  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  }, []);

  useEffect(() => {
    if (activeTab === "scan" && !preview && canScan) {
      startCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [activeTab, preview, canScan]);

  useEffect(() => {
    if (cameraActive && activeTab === "scan" && !preview) {
      startCamera();
    }
  }, [facingMode]);

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
    stopCamera();
  };

  const openUploadPicker = () => {
    uploadInputRef.current?.click();
  };

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedImage && !preview) throw new Error("No image selected");
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
        title: "Analysis Complete",
        description: `Identified: ${data.name}`,
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

  const handleClose = () => {
    stopCamera();
    navigate("/");
  };

  const handleRetake = () => {
    setPreview(null);
    setSelectedImage(null);
    if (activeTab === "scan") {
      startCamera();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={!canScan}
      />

      {!preview ? (
        /* Live Camera View */
        <div className="flex-1 flex flex-col relative bg-foreground">
          {/* Header */}
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-14"
          >
            <button
              onClick={handleClose}
              className="w-11 h-11 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center pressable"
            >
              <X className="w-5 h-5 text-background" />
            </button>
            <button
              onClick={switchCamera}
              className="w-11 h-11 rounded-full bg-background/20 backdrop-blur-md flex items-center justify-center pressable"
            >
              <RefreshCw className="w-5 h-5 text-background" />
            </button>
          </motion.div>

          {/* Camera view */}
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ 
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
                backgroundColor: "hsl(var(--foreground))"
              }}
            />

            {/* Camera error */}
            {cameraError && activeTab === "scan" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground px-6 text-center z-20">
                <div className="w-16 h-16 rounded-full bg-background/10 flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-background/60" />
                </div>
                <p className="text-background/80 font-medium mb-2">Camera access required</p>
                <p className="text-sm text-background/50 mb-4">{cameraError}</p>
                <Button onClick={startCamera} variant="secondary" className="rounded-full">
                  Try Again
                </Button>
              </div>
            )}

            {/* Focus frame */}
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-72 h-72 relative">
                <div className="absolute left-0 top-0 w-16 h-16 border-l-[3px] border-t-[3px] border-background rounded-tl-3xl" />
                <div className="absolute right-0 top-0 w-16 h-16 border-r-[3px] border-t-[3px] border-background rounded-tr-3xl" />
                <div className="absolute left-0 bottom-0 w-16 h-16 border-l-[3px] border-b-[3px] border-background rounded-bl-3xl" />
                <div className="absolute right-0 bottom-0 w-16 h-16 border-r-[3px] border-b-[3px] border-background rounded-br-3xl" />
              </div>
            </motion.div>

            {/* Scans remaining badge */}
            {!profile?.is_premium && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/20 backdrop-blur-md"
              >
                <span className="text-sm text-background font-medium">{scansLeft} scans remaining</span>
              </motion.div>
            )}
          </div>

          {/* Bottom controls */}
          <motion.div 
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-background px-6 py-8 rounded-t-[2rem] -mt-6 relative z-10"
          >
            <div className="text-center mb-6">
              <h2 className="text-display mb-1">Scan Your Meal</h2>
              <p className="text-caption">Position your food in the frame</p>
            </div>

            {/* Tab toggle */}
            <div className="flex justify-center mb-8">
              <div className="tab-pill-container">
                <button
                  onClick={() => {
                    setActiveTab("scan");
                    if (!cameraActive) startCamera();
                  }}
                  disabled={!canScan}
                  className={`tab-pill ${activeTab === "scan" ? "tab-pill-active" : "tab-pill-inactive"}`}
                >
                  Camera
                </button>
                <button
                  onClick={() => {
                    setActiveTab("upload");
                    stopCamera();
                    openUploadPicker();
                  }}
                  disabled={!canScan}
                  className={`tab-pill ${activeTab === "upload" ? "tab-pill-active" : "tab-pill-inactive"}`}
                >
                  Upload
                </button>
              </div>
            </div>

            {/* Capture button */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={openUploadPicker}
                disabled={!canScan}
                className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center pressable"
              >
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </button>

              <button
                onClick={capturePhoto}
                disabled={!canScan || !cameraActive}
                className="w-20 h-20 rounded-full bg-primary flex items-center justify-center pressable disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-full border-4 border-primary-foreground" />
              </button>

              <div className="w-14 h-14" />
            </div>
          </motion.div>
        </div>
      ) : (
        /* Preview View */
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-5 pt-14 pb-4 flex items-center justify-between"
          >
            <button
              onClick={handleRetake}
              className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center pressable"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-section">Preview</h1>
            <div className="w-11" />
          </motion.div>

          {/* Image preview */}
          <div className="flex-1 px-5 pb-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="h-full rounded-3xl overflow-hidden bg-secondary"
            >
              <img
                src={preview}
                alt="Food preview"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Analyzing overlay */}
          {analyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-30"
            >
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full border-4 border-secondary border-t-primary animate-spin" />
                <div>
                  <p className="text-section">Analyzing meal...</p>
                  <p className="text-caption mt-1">Identifying nutrients</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Bottom buttons */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="p-5 pb-10"
          >
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 h-14 rounded-full text-[15px] font-semibold"
              >
                Retake
              </Button>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzing || !canScan}
                className="flex-1 h-14 rounded-full text-[15px] font-semibold"
              >
                {analyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
