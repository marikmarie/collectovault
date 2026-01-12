import React, { useEffect } from "react";
import Icon from "./Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg";
  closeOnOverlayClick?: boolean;
  hideClose?: boolean;
  noOverlay?: boolean;
};

export default function Modal({ open, onClose, title, children, footer, size = "md", closeOnOverlayClick = true, hideClose = false, noOverlay = false }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sizeCls = size === "xs" ? "max-w-sm" : size === "sm" ? "max-w-md" : size === "lg" ? "max-w-4xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 ${noOverlay ? "bg-black/10 backdrop-blur-sm" : "bg-black/60 backdrop-blur-sm"}`}
        onClick={() => closeOnOverlayClick && onClose()}
        aria-hidden
      />
      <div className={`relative w-full ${sizeCls} mx-4 rounded-lg overflow-hidden`}>
        <div className={`${noOverlay ? 'bg-white border border-slate-100 rounded-lg shadow-md' : 'bg-slate-900/40 border border-slate-800 rounded-lg shadow-lg'}`}>
          <div className={`flex items-center justify-between px-3 py-2 border-b ${noOverlay ? 'border-slate-100' : 'border-slate-800'}`}>
            <div>
              {title ? <h3 className={`text-lg font-semibold ${noOverlay ? 'text-slate-800' : 'text-white'}`}>{title}</h3> : null}
            </div>
            {hideClose ? null : (
              <div>
                <button onClick={onClose} className={`${noOverlay ? 'p-2 rounded hover:bg-slate-100 text-slate-600' : 'p-2 rounded hover:bg-slate-800'}`}>
                  <Icon name="close" />
                </button>
              </div>
            )}
          </div>

          <div className={`${noOverlay ? 'p-3 bg-transparent' : 'p-3'}`}>
            {children}
          </div>

          {footer && (
            <div className={`px-3 py-2 border-t ${noOverlay ? 'border-slate-100 bg-white/50' : 'border-slate-800 bg-slate-900/20'}`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
