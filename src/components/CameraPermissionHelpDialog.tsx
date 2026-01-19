import { useMemo } from "react";
import { HelpCircle, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function openDeviceSettings() {
  const ua = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);

  // iOS supports app-settings: deep link in Safari (best-effort)
  if (isIOS) {
    window.location.href = "app-settings:";
    return;
  }

  // Android: best-effort open system settings
  if (isAndroid) {
    // Some browsers support intent: scheme
    window.location.href =
      "intent://settings#Intent;action=android.settings.SETTINGS;end";
    return;
  }

  // Desktop fallback
  window.open("about:preferences", "_blank");
}

export function CameraPermissionHelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const steps = useMemo(
    () => [
      {
        title: "iPhone / iPad (Safari)",
        items: [
          "Open Settings → Safari → Camera → Allow",
          "Also check Settings → Safari → Microphone if needed",
          "Return to the app and tap Scan again",
        ],
      },
      {
        title: "iPhone / iPad (Chrome)",
        items: [
          "Open Settings → Chrome → Camera → Allow",
          "Then in Chrome: tap the lock icon → Site settings → Camera → Allow",
          "Refresh the page and retry",
        ],
      },
      {
        title: "Android (Chrome)",
        items: [
          "Tap the lock icon in the address bar → Permissions",
          "Set Camera to Allow",
          "If still blocked: Android Settings → Apps → (your browser) → Permissions → Camera → Allow",
        ],
      },
    ],
    []
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-panel w-[92vw] max-w-md rounded-[28px] border-border bg-background p-5">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
              <HelpCircle className="h-5 w-5 text-primary" />
            </span>
            Camera permission help
          </DialogTitle>
          <DialogDescription>
            If Scan/Upload doesn’t open, your browser likely blocked camera access.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="glass-panel rounded-2xl p-4">
            <div className="text-xs tracking-[0.18em] text-muted-foreground">QUICK FIX</div>
            <div className="mt-2 text-sm text-foreground">
              Close this dialog → refresh the page → try <span className="font-semibold">Upload</span> first.
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s.title} className="glass-panel rounded-2xl p-4">
                <div className="text-sm font-semibold">{s.title}</div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={openDeviceSettings} className="flex-1 neon-fab">
              Open Settings
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="flex-1 glass-panel"
              onClick={() => onOpenChange(false)}
            >
              Got it
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: “Open Settings” is best-effort—some browsers don’t allow direct deep links.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
