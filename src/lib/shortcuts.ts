import { useEffect } from "react";

export interface ShortcutHandlers {
  onF1Help?: () => void;
  onF2Search?: () => void;
  onF3Racikan?: () => void;
  onF4Patient?: () => void;
  onF5Doctor?: () => void;
  onF6ParkBill?: () => void;
  onF7RecallBill?: () => void;
  onF9SplitPay?: () => void;
  onF10QuickCash?: () => void;
  onF12Checkout?: () => void;
  onCmdK?: () => void;
}

export function useGlobalShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + K or Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handlers.onCmdK?.();
        return;
      }

      switch (e.key) {
        case "F1":
          e.preventDefault();
          handlers.onF1Help?.();
          break;
        case "F2":
          e.preventDefault();
          handlers.onF2Search?.();
          break;
        case "F3":
          e.preventDefault();
          handlers.onF3Racikan?.();
          break;
        case "F4":
          e.preventDefault();
          handlers.onF4Patient?.();
          break;
        case "F5":
          e.preventDefault();
          handlers.onF5Doctor?.();
          break;
        case "F6":
          e.preventDefault();
          handlers.onF6ParkBill?.();
          break;
        case "F7":
          e.preventDefault();
          handlers.onF7RecallBill?.();
          break;
        case "F9":
          e.preventDefault();
          handlers.onF9SplitPay?.();
          break;
        case "F10":
          e.preventDefault();
          handlers.onF10QuickCash?.();
          break;
        case "F12":
          e.preventDefault();
          handlers.onF12Checkout?.();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
