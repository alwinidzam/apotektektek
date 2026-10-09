"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export type AppleToastType = "success" | "error" | "warning" | "info";

export interface AppleToastOptions {
  id?: string;
  type?: AppleToastType;
  title?: string;
  message: string;
  duration?: number; // ms, default 4000
}

interface AppleToastContextValue {
  showToast: (options: AppleToastOptions | string) => void;
  dismissToast: (id: string) => void;
}

const AppleToastContext = createContext<AppleToastContextValue | null>(null);

// Global custom event name for calling showAppleToast anywhere without hooks
const APPLE_TOAST_EVENT = "apple-system-toast-event";

export function showAppleToast(options: AppleToastOptions | string) {
  if (typeof window === "undefined") return;
  const payload: AppleToastOptions =
    typeof options === "string"
      ? { message: options, type: "info" }
      : options;
  window.dispatchEvent(new CustomEvent(APPLE_TOAST_EVENT, { detail: payload }));
}

function playAppleHapticTone(type: AppleToastType) {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === "success") {
      // Crisp iOS dual chime (E5 -> G#5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(830.61, now + 0.08);
      gain2.gain.setValueAtTime(0.14, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.32);
    } else if (type === "error") {
      // Soft Apple alert thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === "warning") {
      // Amber caution tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch {
    // Graceful fallback if audio context is blocked
  }
}

interface ToastItem extends AppleToastOptions {
  id: string;
  type: AppleToastType;
}

export function AppleToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (options: AppleToastOptions | string) => {
      const normalized: ToastItem =
        typeof options === "string"
          ? {
              id: Math.random().toString(36).substring(2, 9),
              type: "info",
              message: options,
              duration: 4000,
            }
          : {
              id: options.id || Math.random().toString(36).substring(2, 9),
              type: options.type || "info",
              title: options.title,
              message: options.message,
              duration: options.duration || 4000,
            };

      playAppleHapticTone(normalized.type);

      setToasts((prev) => {
        // Keep max 3 toasts to prevent screen crowding
        const updated = [...prev.filter((t) => t.id !== normalized.id), normalized];
        return updated.slice(-3);
      });

      if (normalized.duration && normalized.duration > 0) {
        setTimeout(() => {
          dismissToast(normalized.id);
        }, normalized.duration);
      }
    },
    [dismissToast]
  );

  useEffect(() => {
    const handleCustomToast = (event: Event) => {
      const customEvent = event as CustomEvent<AppleToastOptions>;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };

    window.addEventListener(APPLE_TOAST_EVENT, handleCustomToast);
    return () => {
      window.removeEventListener(APPLE_TOAST_EVENT, handleCustomToast);
    };
  }, [showToast]);

  return (
    <AppleToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Floating Apple HIG Dynamic Island Capsule Container */}
      <div className="fixed top-5 inset-x-0 z-[9999] pointer-events-none flex flex-col items-center gap-2.5 px-4 max-w-lg mx-auto">
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";
          const isInfo = toast.type === "info";

          const defaultTitle = isSuccess
            ? "Berhasil"
            : isError
            ? "Peringatan Sistem"
            : isWarning
            ? "Perhatian"
            : "Informasi";

          const title = toast.title || defaultTitle;

          return (
            <div
              key={toast.id}
              role="alert"
              className="pointer-events-auto w-full sm:w-auto min-w-[320px] max-w-[460px] flex items-center gap-3 px-4 py-3 rounded-[20px] bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl shadow-[0_20px_45px_rgba(0,0,0,0.22)] border border-black/[0.08] dark:border-white/[0.14] text-[#1C1C1E] dark:text-white transition-all transform animate-in slide-in-from-top-4 fade-in-0 duration-300"
            >
              {/* Semantic Icon Badge */}
              <div
                className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 shadow-sm ${
                  isSuccess
                    ? "bg-emerald-500 text-white"
                    : isError
                    ? "bg-rose-500 text-white"
                    : isWarning
                    ? "bg-amber-500 text-white"
                    : "bg-[#008B94] text-white"
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />}
                {isError && <AlertCircle className="w-5 h-5 stroke-[2.2]" />}
                {isWarning && <AlertTriangle className="w-5 h-5 stroke-[2.2]" />}
                {isInfo && <Info className="w-5 h-5 stroke-[2.2]" />}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2">
                  <h5 className="text-[13px] font-bold tracking-tight text-[#1C1C1E] dark:text-white truncate">
                    {title}
                  </h5>
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      isSuccess
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : isError
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        : isWarning
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-teal-100 text-[#008B94] dark:bg-teal-950 dark:text-teal-300"
                    }`}
                  >
                    {toast.type}
                  </span>
                </div>
                <p className="text-[12px] text-[#3C3C43] dark:text-[#EBEBF5]/80 mt-0.5 leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </AppleToastContext.Provider>
  );
}

export function useAppleToast() {
  const context = useContext(AppleToastContext);
  if (!context) {
    // If used outside provider, gracefully forward to global dispatcher
    return {
      showToast: showAppleToast,
      dismissToast: () => {},
    };
  }
  return context;
}
