"use client";

import Link from "next/link";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { LuChevronLeft, LuChevronRight, LuLoaderCircle, LuStar, LuX } from "react-icons/lu";

import { cn, initials } from "@/lib/utils";

/* =========================================================
   FOODMART UI PRIMITIVES (storefront)
========================================================= */

/* ---------- Button ---------- */
type Variant = "primary" | "grape" | "outline" | "outlineGrape" | "ghost" | "white" | "danger" | "soft";
const VARIANTS: Record<Variant, string> = {
  primary: "brand-gradient text-white shadow-glow hover:brightness-105",
  grape: "grape-gradient text-white shadow-grape hover:brightness-110",
  outline: "border border-ink-200 bg-white text-ink-800 hover:border-brand-300 hover:text-brand-600",
  outlineGrape: "border-2 border-grape-600 bg-white text-grape-700 hover:bg-grape-50",
  ghost: "text-ink-600 hover:bg-ink-100",
  white: "bg-white text-ink-900 shadow-card hover:bg-ink-50",
  danger: "bg-danger-500 text-white hover:bg-danger-600",
  soft: "bg-brand-50 text-brand-600 hover:bg-brand-100",
};
const SIZES = { sm: "h-9 px-3.5 text-xs gap-1.5", md: "h-11 px-5 text-sm gap-2", lg: "h-12 px-6 text-[15px] gap-2" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: keyof typeof SIZES;
  loading?: boolean;
  icon?: ReactNode;
  pill?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, icon, pill = true, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-60",
        pill ? "rounded-full" : "rounded-xl",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
    >
      {loading ? <LuLoaderCircle className="animate-spin" /> : icon}
      {children}
    </button>
  );
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children, icon }: { href: string; variant?: Variant; size?: keyof typeof SIZES; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <Link href={href} className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap transition", VARIANTS[variant], SIZES[size], className)}>
      {icon}
      {children}
    </Link>
  );
}

/* ---------- Form ---------- */
export function Field({ label, hint, children, className }: { label?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-400">{hint}</span>}
    </label>
  );
}

const controlled = <T extends { value?: unknown }>(props: T) => ("value" in props && props.value == null ? { ...props, value: "" } : props);

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => <input {...controlled(props)} className={cn("field", className)} />;
export const TextArea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...controlled(props)} className={cn("field min-h-24 py-2.5", className)} />;
export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...controlled(props)} className={cn("field appearance-none pr-9", className)}>
    {children}
  </select>
);

/* ---------- Badge ---------- */
type Tone = "orange" | "purple" | "green" | "red" | "gray" | "yellow" | "dark";
const TONES: Record<Tone, string> = {
  orange: "bg-brand-50 text-brand-600",
  purple: "bg-grape-50 text-grape-700",
  green: "bg-success-50 text-success-600",
  red: "bg-danger-50 text-danger-600",
  gray: "bg-ink-100 text-ink-600",
  yellow: "bg-warning-50 text-warning-600",
  dark: "bg-black/55 text-white backdrop-blur",
};
export function Badge({ tone = "gray", className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONES[tone], className)}>{children}</span>;
}

const ORDER_STATUS: Record<string, [string, Tone]> = {
  PENDING: ["Waiting for restaurant", "orange"],
  ACCEPTED: ["Confirmed", "green"],
  PREPARING: ["Preparing", "purple"],
  READY: ["Ready", "purple"],
  COMPLETED: ["Delivered", "green"],
  REJECTED: ["Rejected", "red"],
  CANCELLED: ["Cancelled", "red"],
};
export function OrderStatusBadge({ status }: { status: string }) {
  const [label, tone] = ORDER_STATUS[status] || [status, "gray"];
  return <Badge tone={tone}>{label}</Badge>;
}

/* ---------- Rating ---------- */
export function Rating({ value, count, className }: { value?: number; count?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-ink-800", className)}>
      <LuStar className="fill-warning-400 text-warning-400" />
      {value ? value.toFixed(1) : "New"}
      {count ? <span className="font-normal text-ink-500">({count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count})</span> : null}
    </span>
  );
}

export function Stars({ value, size = "text-sm", onChange }: { value: number; size?: string; onChange?: (v: number) => void }) {
  return (
    <span className={cn("inline-flex gap-0.5", size)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} className={cn(!onChange && "cursor-default")} aria-label={`${n} stars`}>
          <LuStar className={n <= Math.round(value) ? "fill-warning-400 text-warning-400" : "text-ink-300"} />
        </button>
      ))}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ src, name, size = 40, className, ring }: { src?: string | null; name?: string; size?: number; className?: string; ring?: boolean }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name || ""} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", ring && "ring-2 ring-white", className)} style={{ width: size, height: size }} />
  ) : (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-grape-600 font-semibold text-white", ring && "ring-2 ring-white", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Section header (design: icon + title + subtitle + See All + arrows) ---------- */
export function SectionHeader({
  icon,
  title,
  subtitle,
  href,
  onPrev,
  onNext,
  inline = false,
  className,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  href?: string;
  onPrev?: () => void;
  onNext?: () => void;
  inline?: boolean; // subtitle on the same line (design "For You")
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-3", className)}>
      <div className={cn("min-w-0", inline ? "flex flex-wrap items-baseline gap-x-3" : "")}>
        <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900 sm:text-[22px]">
          {icon && <span className="text-[22px] text-brand-500">{icon}</span>}
          {title}
        </h2>
        {subtitle && <p className={cn("text-xs text-ink-500 sm:text-[13px]", !inline && "mt-0.5 ml-0.5", inline && "hidden sm:block")}>{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {href && (
          <Link href={href} className="inline-flex items-center gap-0.5 text-xs font-semibold text-brand-500 hover:text-brand-600 sm:text-[13px]">
            See All <LuChevronRight />
          </Link>
        )}
        {onPrev && (
          <button onClick={onPrev} className="hidden h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-500 sm:flex" aria-label="Previous">
            <LuChevronLeft />
          </button>
        )}
        {onNext && (
          <button onClick={onNext} className="hidden h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-500 sm:flex" aria-label="Next">
            <LuChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Page title ---------- */
export function PageHeading({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-bold tracking-[0.18em] text-brand-500 uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">{actions}</div>}
    </div>
  );
}

/* ---------- Tabs / chips ---------- */
export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-ink-100/80 p-1", className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:text-sm", value === t.value ? "bg-white text-brand-600 shadow-card" : "text-ink-500 hover:text-ink-800")}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1 text-ink-400">{t.count >= 1000 ? `${(t.count / 1000).toFixed(1).replace(/\.0$/, "")}K` : t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, children, onClick, href }: { active?: boolean; children: ReactNode; onClick?: () => void; href?: string }) {
  const cls = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition sm:text-[13px]",
    active ? "border-brand-500 bg-brand-500 text-white" : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:text-brand-600"
  );
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/* ---------- States ---------- */
export const Skeleton = ({ className }: { className?: string }) => <div className={cn("skeleton", className)} />;

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-500">{icon}</div>}
      <p className="font-semibold text-ink-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-ink-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-3xl border border-danger-50 bg-danger-50/60 p-6 text-center">
      <p className="text-sm font-medium text-danger-600">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export const Spinner = ({ className }: { className?: string }) => <LuLoaderCircle className={cn("animate-spin text-brand-500", className)} />;

export const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <Spinner className="text-3xl" />
  </div>
);

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, size = "md" }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-night-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn("animate-fade-up relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-pop sm:rounded-3xl", size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="font-bold text-navy-900">{title}</div>
          <button onClick={onClose} className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Close">
            <LuX className="text-lg" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ---------- Horizontal row with arrow controls ---------- */
export const scrollRow = (el: HTMLElement | null, dir: 1 | -1) => el?.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
