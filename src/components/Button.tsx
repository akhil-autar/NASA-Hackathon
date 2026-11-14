import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = the one accent action per screen; secondary = everything else. */
  variant?: "primary" | "secondary";
  block?: boolean;
  large?: boolean;
}

/**
 * The single button style for the whole app. One accent (primary) per screen;
 * everything else is secondary. Round ends, at least 48px tall, with hover,
 * press and focus states (see base.css).
 */
export function Button({
  variant = "secondary",
  block,
  large,
  className,
  children,
  ...rest
}: Props) {
  const classes = [
    "btn",
    variant === "primary" ? "btn-primary" : "btn-secondary",
    block ? "btn-block" : "",
    large ? "btn-lg" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
