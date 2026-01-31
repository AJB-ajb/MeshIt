"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  animation?: "fade-in" | "slide-up" | "slide-down" | "scale-in";
}

export function AnimatedList({
  children,
  className,
  delay = 0,
  stagger = 50,
  animation = "slide-up",
}: AnimatedListProps) {
  const animationClass = {
    "fade-in": "animate-fade-in",
    "slide-up": "animate-slide-up",
    "slide-down": "animate-slide-down",
    "scale-in": "animate-scale-in",
  }[animation];

  return (
    <div className={cn("space-y-4", className)}>
      {React.Children.map(children, (child, index) => (
        <div
          key={index}
          className={cn("opacity-0", animationClass)}
          style={{ animationDelay: `${delay + index * stagger}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
