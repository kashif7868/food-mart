"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  LuBell,
  LuBookmark,
  LuCamera,
  LuChevronRight,
  LuExternalLink,
  LuHeart,
  LuKeyRound,
  LuLogOut,
  LuMapPin,
  LuPlus,
  LuReceipt,
  LuStore,
  LuTrash2,
  LuUsers,
} from "react-icons/lu";

import { DishCard, PlaceCard, ReelCard } from "@/components/cards/Cards";
import { MealPickerModal } from "@/components/cards/MealPicker";
import { MealReminders } from "./MealReminders";
import { MEALS, mealsText } from "@/lib/meals";
import { DASHBOARD_URL } from "@/components/layout/Header";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Avatar, Badge, Button, Chip, EmptyState, Field, Input, Modal, PageHeading, Select, Skeleton, Tabs } from "@/components/ui";
import { getErrorMessage } from "@/services/api";
import { accountApi, authApi, notificationApi, socialApi } from "@/services/foodmart";
import { cn, PROFILE_TYPE_LABEL, timeAgo } from "@/lib/utils";
import { partnerProfiles, useAuthStore } from "@/store/authStore";
import { CITIES } from "@/store/locationStore";
import type { Address, Food, MealSlot } from "@/lib/types";

/* =========================================================
   ACCOUNT: profile · food preferences · addresses · password
   FAVOURITES: dishes · saved posts · following
   NOTIFICATIONS
========================================================= */

const TASTES = ["biryani", "burgers", "pizza", "bbq", "desi", "chinese", "desserts", "street food", "healthy", "seafood"];

function ProfileCard() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const save = async () => {
    setSaving(true);
    try {
      setUser(await accountApi.update({ name: form.name, phone: form.phone || undefined }));
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try {
      setUser(await accountApi.uploadAvatar(file));
      toast.success("Photo updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  return (
    <section className="card p-5">
      <div className="flex items-center gap-4">
        <label className="group relative cursor-pointer">
          <Avatar src={user.avatar?.url} name={user.name} size={72} />
          <span className="absolute right-0 bottom-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow">
            <LuCamera className="text-sm" />
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-navy-900">{user.name}</p>
          <p className="truncate text-sm text-ink-500">{user.email}</p>
          {user.isEmailVerified ? <Badge tone="green">Email verified</Badge> : <Badge tone="yellow">Email not verified</Badge>}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03xx xxxxxxx" />
        </Field>
      </div>
      <Button className="mt-4" loading={saving} onClick={save}>
        Save changes
      </Button>
    </section>
  );
}

function PreferencesCard() {
  const prefs = useQuery({ queryKey: ["preferences"], queryFn: accountApi.preferences });
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [budgetMax, setBudgetMax] = useState("");
  const [city, setCity] = useState("Karachi");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!prefs.data) return;
    setCuisines(prefs.data.cuisines || []);
    setBudgetMax(prefs.data.budgetMax ? String(prefs.data.budgetMax) : "");
    setCity(prefs.data.manualLocation?.city || "Karachi");
  }, [prefs.data]);
  const save = async () => {
    setSaving(true);
    try {
      await accountApi.updatePreferences({ cuisines, budgetMax: budgetMax ? Number(budgetMax) : undefined, manualLocation: { city, label: city } });
      toast.success("Preferences saved - your recommendations will update");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="card p-5">
      <h2 className="font-bold text-navy-900">Food preferences</h2>
      <p className="text-xs text-ink-500">Used for &ldquo;Picked For You&rdquo; recommendations and nearby results.</p>
      {prefs.isLoading ? (
        <Skeleton className="mt-4 h-24" />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            {TASTES.map((t) => (
              <button
                key={t}
                onClick={() => setCuisines((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium capitalize", cuisines.includes(t) ? "border-brand-500 bg-brand-500 text-white" : "border-ink-200 text-ink-600")}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Usual budget per order (PKR)">
              <Input type="number" min={0} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="2500" />
            </Field>
            <Field label="Home city">
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Button className="mt-4" variant="outline" loading={saving} onClick={save}>
            Save preferences
          </Button>
        </>
      )}
    </section>
  );
}

function AddressesCard() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["addresses"], queryFn: accountApi.addresses });
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const body = { label: editing.label || undefined, phone: editing.phone || undefined, line1: editing.line1, area: editing.area || undefined, city: editing.city, isDefault: Boolean(editing.isDefault) };
      if (editing._id) await accountApi.updateAddress(editing._id, body);
      else await accountApi.addAddress(body);
      toast.success("Address saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const remove = async (id: string) => {
    try {
      await accountApi.removeAddress(id);
      qc.invalidateQueries({ queryKey: ["addresses"] });
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-navy-900">Delivery addresses</h2>
        <Button size="sm" variant="soft" icon={<LuPlus />} onClick={() => setEditing({ label: "Home", city: "Karachi", line1: "" })}>
          Add
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {(list.data || []).map((a) => (
          <div key={a._id} className="flex items-start gap-3 rounded-2xl border border-ink-100 p-3">
            <LuMapPin className="mt-0.5 text-brand-500" />
            <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(a)}>
              <p className="text-sm font-semibold text-navy-900">
                {a.label || "Address"} {a.isDefault && <Badge tone="orange">Default</Badge>}
              </p>
              <p className="text-xs text-ink-500">{[a.line1, a.area, a.city].filter(Boolean).join(", ")}</p>
            </button>
            <button onClick={() => remove(a._id)} className="rounded-full p-1.5 text-ink-400 hover:bg-danger-50 hover:text-danger-500" aria-label="Delete address">
              <LuTrash2 />
            </button>
          </div>
        ))}
        {!list.isLoading && !list.data?.length && <p className="text-sm text-ink-500">No saved addresses yet.</p>}
      </div>
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?._id ? "Edit address" : "New address"}
        footer={
          <Button loading={saving} onClick={save}>
            Save address
          </Button>
        }
      >
        {editing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Label">
              <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Home / Office" />
            </Field>
            <Field label="Phone">
              <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </Field>
            <Field label="House / street" className="sm:col-span-2">
              <Input value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} />
            </Field>
            <Field label="Area">
              <Input value={editing.area} onChange={(e) => setEditing({ ...editing, area: e.target.value })} />
            </Field>
            <Field label="City">
              <Select value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })}>
                {CITIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink-700 sm:col-span-2">
              <input type="checkbox" className="accent-[#ff6b1a]" checked={Boolean(editing.isDefault)} onChange={(e) => setEditing({ ...editing, isDefault: e.target.checked })} /> Use as default
            </label>
          </div>
        )}
      </Modal>
    </section>
  );
}

function PasswordCard() {
  const [form, setForm] = useState({ current: "", next: "" });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await authApi.changePassword(form.current, form.next);
      toast.success("Password changed");
      setForm({ current: "", next: "" });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="card p-5">
      <h2 className="flex items-center gap-2 font-bold text-navy-900">
        <LuKeyRound /> Change password
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Current password">
          <Input type="password" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} autoComplete="current-password" />
        </Field>
        <Field label="New password">
          <Input type="password" value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} autoComplete="new-password" />
        </Field>
      </div>
      <Button className="mt-4" variant="outline" loading={saving} disabled={!form.current || form.next.length < 8} onClick={save}>
        Update password
      </Button>
    </section>
  );
}

function Account() {
  const { profiles, user, logout } = useAuthStore();
  const partners = partnerProfiles(profiles);
  const links = [
    { href: "/orders", label: "My orders", icon: LuReceipt },
    { href: "/favourites", label: "Favourites & saved", icon: LuHeart },
    { href: "/notifications", label: "Notifications", icon: LuBell },
  ];
  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading title="My account" />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <ProfileCard />
          <PreferencesCard />
          <AddressesCard />
          <PasswordCard />
        </div>
        <aside className="space-y-4">
          <div className="card divide-y divide-ink-100">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-ink-800 hover:bg-ink-50">
                <Icon className="text-lg text-brand-500" /> <span className="flex-1">{label}</span> <LuChevronRight className="text-ink-400" />
              </Link>
            ))}
          </div>
          <div className="grape-gradient rounded-3xl p-5 text-white shadow-grape">
            <LuStore className="text-2xl" />
            {partners.length || user?.globalRoles?.length ? (
              <>
                <p className="mt-2 font-bold">{user?.globalRoles?.length ? "FoodMart team" : "Your business"}</p>
                <p className="text-sm text-white/85">{partners.map((m) => `${m.profile.displayName} (${PROFILE_TYPE_LABEL[m.profile.profileType]})`).join(", ") || "Open the FoodMart panel"}</p>
                <a href={`${DASHBOARD_URL}/signin`} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-grape-700">
                  Open dashboard <LuExternalLink />
                </a>
              </>
            ) : (
              <>
                <p className="mt-2 font-bold">Sell on FoodMart</p>
                <p className="text-sm text-white/85">Restaurant, home chef, food point or blogger? Add a business profile to this account.</p>
                <Link href="/partner" className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-grape-700">
                  Partner with us
                </Link>
              </>
            )}
          </div>
          <Button variant="outline" className="w-full text-danger-600" icon={<LuLogOut />} onClick={() => logout()}>
            Sign out
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Favourites() {
  const [tab, setTab] = useState<"dishes" | "saved" | "following">("dishes");
  const [meal, setMeal] = useState<MealSlot | "">("");
  const [editing, setEditing] = useState<{ food: Food; slots: MealSlot[] } | null>(null);
  const foods = useQuery({ queryKey: ["fav-foods", meal], queryFn: () => accountApi.favoriteFoods(meal || undefined), enabled: tab === "dishes" });
  const saved = useQuery({ queryKey: ["saved-posts"], queryFn: accountApi.savedPosts, enabled: tab === "saved" });
  const following = useQuery({ queryKey: ["following"], queryFn: accountApi.following, enabled: tab === "following" });
  const loading = tab === "dishes" ? foods.isLoading : tab === "saved" ? saved.isLoading : following.isLoading;
  return (
    <div className="container-fm py-6 sm:py-8">
      <PageHeading
        title="Favourites"
        actions={
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { value: "dishes", label: "Dishes" },
              { value: "saved", label: "Saved posts" },
              { value: "following", label: "Following" },
            ]}
          />
        }
      />
      {loading ? (
        <Skeleton className="h-60" />
      ) : tab === "dishes" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Chip active={meal === ""} onClick={() => setMeal("")}>
              All
            </Chip>
            {MEALS.map((m) => (
              <Chip key={m.value} active={meal === m.value} onClick={() => setMeal(m.value)}>
                <span aria-hidden>{m.emoji}</span> {m.label.split(" (")[0]}
              </Chip>
            ))}
            <Link href="/notifications#meals" className="ml-auto text-xs font-semibold text-brand-600 hover:underline">
              Meal reminder times
            </Link>
          </div>
          {foods.data?.items.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5">
              {foods.data.items.map(({ food, mealSlots }) => (
                <div key={food._id}>
                  <DishCard food={{ ...food, viewer: { isFavorite: true, mealSlots } } as never} compact />
                  <button
                    onClick={() => setEditing({ food, slots: mealSlots || [] })}
                    className="mt-1.5 w-full truncate rounded-lg bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-600 hover:bg-brand-50 hover:text-brand-600"
                  >
                    {mealSlots?.length ? mealsText(mealSlots) : "Choose a meal"} · Edit
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<LuHeart />}
              title={meal ? "No favourites for this meal yet" : "No favourite dishes yet"}
              text={meal ? "Open a favourite dish and tap Edit to file it under this meal." : "Tap the heart on any dish to save it here."}
            />
          )}
          <MealPickerModal
            open={!!editing}
            onClose={() => setEditing(null)}
            initial={editing?.slots || []}
            dishName={editing?.food.name}
            onSave={async (slots) => {
              if (!editing) return false;
              try {
                await socialApi.favoriteMeals(editing.food._id, slots);
                toast.success("Meals saved");
                foods.refetch();
                return true;
              } catch (error) {
                toast.error(getErrorMessage(error));
                return false;
              }
            }}
          />
        </>
      ) : tab === "saved" ? (
        saved.data?.items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {saved.data.items.map(({ post }) => (
              <ReelCard key={post._id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<LuBookmark />} title="No saved posts yet" />
        )
      ) : following.data?.items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {following.data.items.map(({ profile }) => (
            <PlaceCard key={profile._id} profile={{ ...profile, viewer: { isFollowing: true } }} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<LuUsers />} title="You're not following anyone yet" />
      )}
    </div>
  );
}

function Notifications() {
  const list = useQuery({ queryKey: ["notifications"], queryFn: notificationApi.list });
  const markAll = async () => {
    await notificationApi.markAllRead().catch(() => null);
    list.refetch();
  };
  return (
    <div className="container-fm max-w-3xl py-6 sm:py-8">
      <PageHeading
        title="Notifications"
        actions={
          <Button size="sm" variant="outline" onClick={markAll}>
            Mark all read
          </Button>
        }
      />
      <MealReminders />
      {list.isLoading ? (
        <Skeleton className="h-60" />
      ) : !list.data?.items.length ? (
        <EmptyState icon={<LuBell />} title="You're all caught up" />
      ) : (
        <div className="card divide-y divide-ink-100">
          {list.data.items.map((n) => {
            const href = n.targetUrl?.startsWith("/") ? n.targetUrl : undefined;
            const body = (
              <div className="flex gap-3 p-4">
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-brand-500")} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-900">{n.title}</p>
                  {n.body && <p className="text-sm text-ink-600">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-ink-400">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            );
            return href ? (
              <Link key={n._id} href={href} className="block hover:bg-ink-50">
                {body}
              </Link>
            ) : (
              <div key={n._id}>{body}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const AccountPage = () => (
  <RequireAuth>
    <Account />
  </RequireAuth>
);
export const FavouritesPage = () => (
  <RequireAuth>
    <Favourites />
  </RequireAuth>
);
export const NotificationsPage = () => (
  <RequireAuth>
    <Notifications />
  </RequireAuth>
);
