import React, { type JSX } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
};

export default function Card({ children, className = "", as: Component = "div" }: Props) {
  const cls = `themed-card ${className}`;
  return <Component className={cls}>{children}</Component>;
}
