"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export function SubmitButton({ 
  children, 
  icon,
  className = "btn-primary",
  loadingText = "Saving...",
  style
}: { 
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  loadingText?: string;
  style?: React.CSSProperties;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={className} disabled={pending} style={style}>
      {pending ? <Loader2 size={18} className="animate-spin" /> : icon}
      {pending ? loadingText : children}
    </button>
  );
}
