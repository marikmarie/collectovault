import React, { type JSX } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

export default function Card({ children, className = "", as: Component = "div" }: Props) {
  const cls = `bg-slate-900/40 border border-slate-800 rounded-lg p-4 shadow-sm ${className}`;
  return <Component className={cls}>{children}</Component>;
}
