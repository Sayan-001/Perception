import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: number | string;
  className?: string;
  variant?: "inline" | "centered" | "fullscreen";
}

export function Loading({
  size = 24,
  className = "",
  variant = "centered",
}: LoadingProps) {
  const spinner = (
    <Loader2
      size={size}
      className={`animate-spin text-blue-600 ${className}`}
    />
  );

  if (variant === "inline") {
    return spinner;
  }

  if (variant === "centered") {
    return (
      <div className="flex justify-center items-center p-4 w-full h-full min-h-[100px]">
        {spinner}
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="fixed inset-0 flex justify-center items-center bg-white/60 backdrop-blur-[2px] z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
