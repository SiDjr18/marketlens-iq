import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
};

const variants = {
  primary: "bg-teal text-white hover:bg-[#0aa69f] border-teal",
  secondary: "bg-white text-slate-900 hover:bg-slate-50 border-border",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border-transparent",
  danger: "bg-white text-red-700 hover:bg-red-50 border-red-200"
};

export function Button({ variant = "secondary", icon, className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
