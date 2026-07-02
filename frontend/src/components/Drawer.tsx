import { useEffect } from "react";
import type { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, onClose, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div className={`drawer-overlay ${open ? "drawer-overlay-open" : ""}`} onClick={onClose} aria-hidden={!open}>
      <div
        className={`drawer-panel ${open ? "drawer-panel-open" : ""}`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
