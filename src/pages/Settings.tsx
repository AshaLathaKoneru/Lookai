import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Check, User } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
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

  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize name when profile loads
  useState(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let avatarUrl = profile?.avatar_url;

      // Upload avatar if new file selected
      if (avatarFile) {
        setIsUploading(true);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
        setIsUploading(false);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ 
          name: name || profile?.name,
          avatar_url: avatarUrl 
        })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profile Updated!", description: "Your changes have been saved." });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/profile");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsUploading(false);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="shimmer h-8 w-32 rounded-full" />
      </div>
    );
  }

  const displayName = name || profile?.name || profile?.email?.split("@")[0] || "";
  const currentAvatar = avatarPreview || profile?.avatar_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-4 pt-12 pb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/profile")}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center pressable"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold tracking-wide">Settings</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Avatar Section */}
        <div className="trading-card rounded-[28px] p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Profile Picture</h2>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border-2 border-primary/50 overflow-hidden">
                {currentAvatar ? (
                  <img 
                    src={currentAvatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center pressable"
              >
                <Camera className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>

            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Change Photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG up to 5MB</p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Name Section */}
        <div className="trading-card rounded-[28px] p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Display Name</h2>
          
          <Input
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="bg-muted/50 border-none rounded-xl h-12 text-base focus-visible:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-2">This is how you'll appear in the app</p>
        </div>

        {/* Account Info */}
        <div className="trading-card rounded-[28px] p-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4">Account</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{profile?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Member since</span>
              <span className="text-sm font-medium">
                {profile?.created_at 
                  ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="chip px-2 py-1">
                <span className="text-xs font-medium">
                  {profile?.is_premium ? '⭐ Premium' : 'Free'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={() => updateProfileMutation.mutate()}
          disabled={updateProfileMutation.isPending || isUploading}
          className="w-full h-14 neon-fab rounded-full text-base font-bold tracking-wide flex items-center justify-center gap-2"
        >
          {updateProfileMutation.isPending || isUploading ? (
            <span className="inline-flex items-center gap-2">
              <span className="shimmer h-4 w-16 rounded-full" />
              Saving...
            </span>
          ) : (
            <>
              <Check className="w-5 h-5" />
              SAVE CHANGES
            </>
          )}
        </Button>

        {/* Spacer for bottom */}
        <div className="h-8" />
      </div>
    </div>
  );
}
