import React, { useEffect } from "react";
import Icon from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnOverlayClick?: boolean;
};

export default function Modal({ open, onClose, title, children, footer, size = "md", closeOnOverlayClick = true }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => closeOnOverlayClick && onClose()}
        aria-hidden
      />
      <div className={`relative w-full ${sizeCls} mx-4 rounded-lg overflow-hidden`}>
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <div>
              {title ? <h3 className="text-lg font-semibold">{title}</h3> : null}
            </div>
            <div>
              <button onClick={onClose} className="p-2 rounded hover:bg-slate-800">
                <Icon name="close" />
              </button>
            </div>
          </div>

          <div className="p-4">
            {children}
          </div>

          {footer && (
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-900/20">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
