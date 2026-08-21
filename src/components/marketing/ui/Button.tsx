import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * The public site's button system — deliberately separate from
 * components/ui/Button.tsx (which the authenticated app uses). Only two
 * variants, matching the brief exactly: no proliferation of one-off styles.
 */
type Variant = "primary" | "secondary";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 pub-focus disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-crimson text-white hover:bg-crimson-hover shadow-sm hover:shadow-md",
  secondary:
    "bg-white text-charcoal-dark border border-charcoal/25 hover:bg-charcoal/5 hover:border-charcoal/40",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

interface ButtonAsButton
  extends CommonProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  href?: undefined;
  isLoading?: boolean;
}

interface ButtonAsLink extends CommonProps {
  href: string;
  isLoading?: never;
}

type PublicButtonProps = ButtonAsButton | ButtonAsLink;

/** Renders a <Link> when `href` is given, a <button> otherwise — one
 * component, one visual system, for every CTA on the public site.
 *
 * Destructures variant/size/className/children/isLoading/disabled all in
 * one pass so `rest` can never still be carrying a raw `className` that
 * would clobber the computed `classes` when spread onto the element below
 * (that exact bug previously left plain <button> instances — the lead
 * form's submit button, chiefly — rendered with none of their styling). */
export function PublicButton(props: PublicButtonProps) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { isLoading, disabled, ...buttonProps } = rest as Omit<ButtonAsButton, "variant" | "size" | "className" | "children">;
  return (
    <button className={classes} disabled={disabled || isLoading} {...buttonProps}>
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
