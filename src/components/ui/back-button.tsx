"use client";

import { useRouter } from "next/navigation";
import { Button } from "./button";
import { ArrowLeft } from "lucide-react";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface BackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fallbackUrl?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  showIcon?: boolean;
  children?: React.ReactNode;
}

const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ fallbackUrl, variant = "outline", showIcon = true, children, className, ...props }, ref) => {
    const router = useRouter();

    const handleBack = () => {
      if (fallbackUrl) {
        router.push(fallbackUrl);
      } else if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
      } else {
        router.push("/dashboard");
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        onClick={handleBack}
        className={className}
        {...props}
      >
        {showIcon && <ArrowLeft className="h-4 w-4 mr-2" />}
        {children || "Retour"}
      </Button>
    );
  }
);

BackButton.displayName = "BackButton";

export { BackButton };
