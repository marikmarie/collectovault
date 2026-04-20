import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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

const sizeMap = {
  xs: "28rem",
  sm: "32rem",
  md: "42rem",
  lg: "64rem",
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

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={() => closeOnOverlayClick && onClose()}
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: noOverlay ? "transparent" : "rgba(0,0,0,0.55)",
          backdropFilter: noOverlay ? "none" : "blur(4px)",
        }}
        aria-hidden
      />

      {/* Modal box */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: sizeMap[size] ?? "42rem",
          backgroundColor: "#ffffff",
          borderRadius: "0.75rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid #e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <div>
            {title ? (
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600, color: "#111827" }}>
                {title}
              </h3>
            ) : null}
          </div>
          {!hideClose && (
            <button
              onClick={onClose}
              style={{
                padding: "0.4rem",
                borderRadius: "0.375rem",
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <Icon name="close" />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "1rem", backgroundColor: "#ffffff" }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
