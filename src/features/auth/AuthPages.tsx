"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { LuArrowRight, LuChefHat, LuCircleCheck, LuCompass, LuExternalLink, LuEye, LuEyeOff, LuMailCheck, LuStore, LuUtensilsCrossed } from "react-icons/lu";

import { HeroArt } from "@/components/brand/FoodArt";
import { Logo } from "@/components/brand/Logo";
import { DASHBOARD_URL } from "@/components/layout/Header";
import { Button, Field, Input, Select } from "@/components/ui";
import { getErrorMessage } from "@/services/api";
import { authApi, discoveryApi } from "@/services/foodmart";
import { cn } from "@/lib/utils";
import { partnerProfiles, useAuthStore } from "@/store/authStore";
import { CITIES } from "@/store/locationStore";
import { post } from "@/services/api";

/* =========================================================
   AUTH: Sign in · Sign up (customer) · Partner with us
         Forgot / Reset password · Verify email
   Backend: /auth/login, /auth/register, /profiles (add a business
   profile to an existing account), /auth/password/*, /auth/email/verify
========================================================= */

const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

export function AuthShell({ title, subtitle, children, side }: { title: string; subtitle?: string; children: ReactNode; side?: ReactNode }) {
  return (
    <div className="container-fm grid min-h-[calc(100vh-120px)] items-center gap-10 py-8 lg:grid-cols-2">
      <div className="relative hidden h-full min-h-[520px] overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-50 via-white to-grape-50 p-10 lg:block">
        <Logo />
        <h2 className="mt-8 max-w-sm text-4xl leading-tight font-extrabold text-navy-900">
          {side || (
            <>
              Good food brings <span className="text-brand-gradient">better people</span> together
            </>
          )}
        </h2>
        <p className="mt-3 max-w-sm text-sm text-ink-600">Order from restaurants, home chefs and street-food spots, watch food reels and follow your favourite bloggers.</p>
        <HeroArt className="absolute bottom-6 left-1/2 w-[78%] max-w-[440px] -translate-x-1/2" />
      </div>
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-extrabold text-navy-900">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}

const PasswordInput = ({ value, onChange, autoComplete = "current-password" }: { value: string; onChange: (v: string) => void; autoComplete?: string }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} required autoComplete={autoComplete} className="pr-10" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-400" aria-label="Show password">
        {show ? <LuEyeOff /> : <LuEye />}
      </button>
    </div>
  );
};

/* ---------------- Sign in ---------------- */

export function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, user } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const next = safeNext(params.get("next"));

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await login(email, password);
      toast.success(`Welcome back, ${r.user.name.split(" ")[0]}!`);
      router.replace(next);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to order food, save favourites and follow your favourite spots.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-500 hover:text-brand-600">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Sign In
        </Button>
        <p className="text-center text-sm text-ink-500">
          New to FoodMart?{" "}
          <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-grape-700">
            Create an account
          </Link>
        </p>
        <Link href="/partner" className="flex items-center justify-between rounded-2xl border border-ink-100 bg-ink-50/60 p-4 text-sm text-ink-700 hover:border-grape-200">
          <span>
            <b className="block text-navy-900">Own a restaurant or food point?</b>
            Partner with FoodMart
          </span>
          <LuArrowRight className="text-grape-600" />
        </Link>
      </form>
    </AuthShell>
  );
}

/* ---------------- Sign up (customer) ---------------- */

const TASTES = ["biryani", "burgers", "pizza", "bbq", "desi", "chinese", "desserts", "street food", "healthy"];

export function SignupPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { register, user } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", city: "Karachi" });
  const [tastes, setTastes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState(false);
  const next = safeNext(params.get("next"));
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, next, router]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await register({ ...form, phone: form.phone || undefined, cuisines: tastes, profileType: "BUYER" });
      if (r.requiresEmailVerification) setVerifyEmail(true);
      else {
        toast.success("Welcome to FoodMart!");
        router.replace(next);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (verifyEmail) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a verification link to ${form.email}.`}>
        <div className="rounded-2xl bg-success-50 p-5 text-sm text-success-600">
          <LuMailCheck className="mb-2 text-2xl" />
          Open the link in the email to activate your account, then sign in.
        </div>
        <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-500">
          Go to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Discover, order and share food you'll love.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name">
          <Input value={form.name} onChange={set("name")} required autoComplete="name" placeholder="Ali Raza" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
          </Field>
          <Field label="Phone (optional)">
            <Input value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="03xx xxxxxxx" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" hint="8+ characters with a letter and a number">
            <PasswordInput value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} autoComplete="new-password" />
          </Field>
          <Field label="City">
            <Select value={form.city} onChange={set("city")}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        <div>
          <p className="label">What do you love? (for better recommendations)</p>
          <div className="flex flex-wrap gap-2">
            {TASTES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTastes((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium capitalize", tastes.includes(t) ? "border-brand-500 bg-brand-500 text-white" : "border-ink-200 text-ink-600")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <Button type="submit" size="lg" variant="grape" loading={loading} className="w-full">
          Sign Up
        </Button>
        <p className="text-center text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-500">
            Sign in
          </Link>
        </p>
        <p className="text-center text-[11px] text-ink-400">
          By signing up you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
    </AuthShell>
  );
}

/* ---------------- Partner with us ---------------- */

const PARTNER_TYPES = [
  { value: "RESTAURANT", label: "Restaurant", text: "Menu, orders, offers & campaigns", icon: LuStore },
  { value: "CHEF", label: "Home Chef", text: "Sell home-cooked food", icon: LuChefHat },
  { value: "LOCAL_POINT", label: "Local Food Point", text: "Stalls, dhabas, carts", icon: LuUtensilsCrossed },
  { value: "BLOGGER", label: "Food Blogger", text: "Reels, reviews & collaborations", icon: LuCompass },
] as const;

export function PartnerPage() {
  const { register, user, profiles, refresh } = useAuthStore();
  const config = useQuery({ queryKey: ["platform-config"], queryFn: discoveryApi.config });
  const allowed = (config.data?.["registration.partnerTypes"] as string[] | undefined) || PARTNER_TYPES.map((t) => t.value);
  const [type, setType] = useState<string>("RESTAURANT");
  const [form, setForm] = useState({ businessName: "", name: "", email: "", phone: "", password: "", city: "Karachi" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { verify: boolean }>(null);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const existing = partnerProfiles(profiles);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (user) {
        /* signed-in customer adds a business profile to the same account */
        await post("/profiles", { profileType: type, displayName: form.businessName, city: form.city });
        await refresh();
        setDone({ verify: false });
      } else {
        const r = await register({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined, city: form.city, profileType: type as "RESTAURANT", profileDisplayName: form.businessName });
        setDone({ verify: Boolean(r.requiresEmailVerification) });
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="You're in! 🎉" subtitle="Your business profile is ready." side={<>Grow with <span className="text-brand-gradient">FoodMart</span></>}>
        <div className="space-y-4">
          <div className="flex gap-3 rounded-2xl bg-success-50 p-4 text-sm text-success-600">
            <LuCircleCheck className="mt-0.5 shrink-0 text-xl" />
            <p>
              {done.verify ? "Verify your email first (we sent you a link). " : ""}Open the FoodMart dashboard and sign in with the same email and password to add your menu, offers and reels.
            </p>
          </div>
          <a href={`${DASHBOARD_URL}/signin`} className="brand-gradient flex h-12 items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-glow">
            Open partner dashboard <LuExternalLink />
          </a>
          <Link href="/" className="block text-center text-sm font-medium text-ink-500 hover:text-brand-500">
            Back to FoodMart
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Partner with FoodMart"
      subtitle="Reach food lovers in your city with menus, offers, reels and blogger collaborations."
      side={
        <>
          Grow your food business with <span className="text-brand-gradient">FoodMart</span>
        </>
      }
    >
      {existing.length > 0 && (
        <a href={`${DASHBOARD_URL}/signin`} className="mb-5 flex items-center justify-between rounded-2xl border border-grape-100 bg-grape-50 p-4 text-sm text-grape-700">
          <span>
            You already manage <b>{existing.map((m) => m.profile.displayName).join(", ")}</b>
          </span>
          <LuExternalLink />
        </a>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2.5">
          {PARTNER_TYPES.filter((t) => allowed.includes(t.value)).map(({ value, label, text, icon: Icon }) => (
            <button
              type="button"
              key={value}
              onClick={() => setType(value)}
              className={cn("rounded-2xl border p-3 text-left transition", type === value ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100" : "border-ink-200 hover:border-ink-300")}
            >
              <Icon className={cn("text-xl", type === value ? "text-brand-500" : "text-ink-500")} />
              <p className="mt-1.5 text-sm font-semibold text-navy-900">{label}</p>
              <p className="text-[11px] text-ink-500">{text}</p>
            </button>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={type === "BLOGGER" ? "Creator name" : "Business name"}>
            <Input value={form.businessName} onChange={set("businessName")} required placeholder={type === "BLOGGER" ? "Karachi Food Diaries" : "The Burger Lab"} />
          </Field>
          <Field label="City">
            <Select value={form.city} onChange={set("city")}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
        </div>
        {!user && (
          <>
            <Field label="Your full name">
              <Input value={form.name} onChange={set("name")} required autoComplete="name" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <Input type="email" value={form.email} onChange={set("email")} required autoComplete="email" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={set("phone")} autoComplete="tel" placeholder="03xx xxxxxxx" />
              </Field>
            </div>
            <Field label="Password" hint="8+ characters with a letter and a number">
              <PasswordInput value={form.password} onChange={(v) => setForm((f) => ({ ...f, password: v }))} autoComplete="new-password" />
            </Field>
          </>
        )}
        {user && <p className="rounded-2xl bg-ink-50 p-3 text-xs text-ink-600">The business profile will be added to your account ({user.email}).</p>}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          {user ? "Create business profile" : "Create partner account"}
        </Button>
        {!user && (
          <p className="text-center text-sm text-ink-500">
            Already on FoodMart?{" "}
            <Link href="/login?next=/partner" className="font-semibold text-brand-500">
              Sign in first
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}

/* ---------------- Forgot / reset / verify ---------------- */

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell title="Forgot password?" subtitle="We'll email you a link to reset it.">
      {sent ? (
        <div className="rounded-2xl bg-success-50 p-5 text-sm text-success-600">If an account exists for {email}, a reset link is on its way.</div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Send reset link
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-brand-500">
        Back to sign in
      </Link>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success("Password updated. Please sign in.");
      router.replace("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthShell title="Choose a new password">
      {!token ? (
        <p className="text-sm text-danger-600">This reset link is invalid. Request a new one.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="New password" hint="8+ characters with a letter and a number">
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full">
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<"loading" | "ok" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail(token)
      .then(() => setState("ok"))
      .catch((error) => {
        setMessage(getErrorMessage(error));
        setState("error");
      });
  }, [token]);
  return (
    <AuthShell title={state === "ok" ? "Email verified" : state === "loading" ? "Verifying..." : "Verification failed"}>
      {state === "ok" && (
        <div className="space-y-4">
          <p className="rounded-2xl bg-success-50 p-4 text-sm text-success-600">Your email is verified. You can sign in now.</p>
          <Link href="/login" className="font-semibold text-brand-500">
            Sign in
          </Link>
        </div>
      )}
      {state === "error" && <p className="rounded-2xl bg-danger-50 p-4 text-sm text-danger-600">{message || "This verification link is invalid or expired."}</p>}
    </AuthShell>
  );
}
