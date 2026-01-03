"use client";

import { useEffect, useCallback, useRef } from "react";

interface GoogleOneTapProps {
  callbackUrl?: string;
  context?: "signin" | "signup" | "use";
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleOneTapConfig) => void;
          prompt: (
            callback?: (notification: PromptNotification) => void,
          ) => void;
          cancel: () => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonConfig,
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleOneTapConfig {
  client_id: string;
  callback: (response: { credential: string; select_by: string }) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
  context?: "signin" | "signup" | "use";
  itp_support?: boolean;
  login_uri?: string;
  prompt_parent_id?: string;
  state_cookie_domain?: string;
}

interface GoogleButtonConfig {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface PromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
  getMomentType: () => string;
}

export function GoogleOneTap({
  callbackUrl = "/problems",
  context = "signin",
}: GoogleOneTapProps) {
  const initialized = useRef(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCredentialResponse = useCallback(
    async (response: { credential: string; select_by: string }) => {
      try {
        const res = await fetch("/api/auth/google-one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credential: response.credential,
            selectBy: response.select_by,
          }),
        });

        if (res.ok) {
          window.location.href = callbackUrl;
        } else {
          console.error("[GoogleOneTap] Auth failed:", await res.text());
        }
      } catch (err) {
        console.error("[GoogleOneTap] Error:", err);
      }
    },
    [callbackUrl],
  );

  useEffect(() => {
    if (!clientId || initialized.current) return;

    const initializeGoogleOneTap = () => {
      if (!window.google?.accounts?.id) return;

      initialized.current = true;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: true, // Auto-select if user previously signed in
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: true,
        context: context,
        itp_support: true, // Safari Intelligent Tracking Prevention support
        prompt_parent_id: "g_id_onload", // Container for One Tap UI
      });

      window.google.accounts.id.prompt(notification => {
        if (notification.isNotDisplayed()) {
          const reason = notification.getNotDisplayedReason();
          // Only log if it's an unexpected reason
          if (
            !["opt_out_or_no_session", "suppressed_by_user"].includes(reason)
          ) {
            console.log("[GoogleOneTap] Not displayed:", reason);
          }
        }
      });
    };

    // Check if script already loaded
    if (window.google?.accounts?.id) {
      initializeGoogleOneTap();
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleOneTap;
    document.head.appendChild(script);

    return () => {
      window.google?.accounts?.id?.cancel();
    };
  }, [clientId, context, handleCredentialResponse]);

  // Render container for One Tap prompt positioning
  return (
    <div
      id="g_id_onload"
      className="fixed top-4 right-4 z-[100]"
      style={{ colorScheme: "normal" }}
    />
  );
}
