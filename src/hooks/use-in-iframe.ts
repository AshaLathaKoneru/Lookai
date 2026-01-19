import { useMemo } from "react";

/**
 * Detects whether the app is running inside an iframe.
 * In Lovable preview this is typically true, and camera/file pickers may be restricted.
 */
export function useInIframe() {
  return useMemo(() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }, []);
}
