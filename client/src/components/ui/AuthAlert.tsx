"use client";
import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type AlertVariant = "error" | "success" | "info" | "warning";

interface AuthAlertProps {
  variant?: AlertVariant;
  message: string | null | undefined;
  onDismiss?: () => void;
  /** Auto-dismiss after ms. 0 = no auto-dismiss */
  autoDismiss?: number;
}

const config: Record<
  AlertVariant,
  { bg: string; border: string; icon: React.ReactNode; text: string; bar: string }
> = {
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    bar: "bg-red-400",
    icon: <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />,
  },
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    bar: "bg-emerald-400",
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-400",
    icon: <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    bar: "bg-blue-400",
    icon: <Info className="w-4 h-4 shrink-0 text-blue-500" />,
  },
};

export function AuthAlert({
  variant = "error",
  message,
  onDismiss,
  autoDismiss = 0,
}: AuthAlertProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Animate in when message changes
  useEffect(() => {
    if (message) {
      setExiting(false);
      // small delay so CSS transition triggers
      requestAnimationFrame(() => setVisible(true));

      if (autoDismiss > 0) {
        const timer = setTimeout(() => dismiss(), autoDismiss);
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [message]);

  const dismiss = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 250);
  };

  if (!message) return null;

  const { bg, border, text, bar, icon } = config[variant];

  return (
    <div
      style={{
        opacity: visible && !exiting ? 1 : 0,
        transform: visible && !exiting ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
      }}
      className={`relative rounded-xl border ${bg} ${border} overflow-hidden`}
      role="alert"
      aria-live="polite"
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${bar} rounded-l-xl`} />

      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span className="mt-0.5">{icon}</span>
        <p className={`text-sm font-medium leading-snug flex-1 ${text}`}>{message}</p>

        {onDismiss && (
          <button
            type="button"
            onClick={dismiss}
            className={`${text} opacity-60 hover:opacity-100 transition-opacity shrink-0 -mr-1 -mt-0.5`}
            aria-label="Dismiss alert"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
