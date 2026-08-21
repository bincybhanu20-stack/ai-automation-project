"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Stagger multiple reveals on the same section, in milliseconds. */
  delayMs?: number;
}

/**
 * Fades content up into place the first time it scrolls into view. Plain
 * IntersectionObserver — no animation library, keeping the public site's
 * JS bundle small. The actual animation (and honoring
 * prefers-reduced-motion) lives in the .pub-fade-up CSS rule in
 * globals.css; this component only decides WHEN to apply that class.
 */
export function ScrollReveal({ children, className, delayMs = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(className, visible && "pub-fade-up")}
      style={visible ? { animationDelay: `${delayMs}ms` } : { opacity: 0 }}
    >
      {children}
    </div>
  );
}
