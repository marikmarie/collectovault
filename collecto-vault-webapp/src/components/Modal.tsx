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
    <div className="fixed inset-0 z-9999 flex items-center justify-center">
      <div
        className={`absolute inset-0 ${noOverlay ? "bg-black/0" : "bg-black/60 backdrop-blur-sm"}`}
        onClick={() => closeOnOverlayClick && onClose()}
        aria-hidden
      />
      <div className={`relative w-full ${sizeCls} mx-4 rounded-lg overflow-hidden`}>
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
            <div>
              {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : null}
            </div>
            {hideClose ? null : (
              <div>
                <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 text-gray-600">
                  <Icon name="close" />
                </button>
              </div>
            )}
          </div>

          <div className="p-3 bg-white">
            {children}
          </div>

          {footer && (
            <div className="px-3 py-2 border-t border-gray-200 bg-white">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
