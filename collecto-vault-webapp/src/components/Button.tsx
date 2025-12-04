// src/components/common/Button.tsx
import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type BaseButtonAttrs = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "children">;

export type Props = BaseButtonAttrs & {
  variant?: Variant;
  loading?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: React.ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-emerald-500 hover:bg-emerald-600 text-white",
  secondary: "bg-white text-slate-900 hover:bg-slate-100",
  ghost: "bg-transparent text-slate-200 hover:bg-slate-800",
  danger: "bg-rose-500 hover:bg-rose-600 text-white",
};

const Button: React.FC<Props> = ({
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  children,
  onClick,
  ...rest
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold shadow-sm transition";
  const disabledOrLoading = disabled || loading;
  const cls = `${base} ${variantClasses[variant]} ${disabledOrLoading ? "opacity-60 cursor-not-allowed" : ""} ${className}`;

  return (
    <button
      type="button"
      className={cls}
      disabled={disabledOrLoading}
      onClick={onClick}
      {...rest}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
          <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
