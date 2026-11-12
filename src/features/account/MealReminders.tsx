"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LuBellRing } from "react-icons/lu";

import { Button, Input, Skeleton } from "@/components/ui";
import { MEALS } from "@/lib/meals";
import type { MealSlot } from "@/lib/types";
import { getErrorMessage } from "@/services/api";
import { notificationApi, type MealSettings } from "@/services/foodmart";

/* =========================================================
   MEAL REMINDERS
   Backend: GET/PATCH /notification-preferences/meals,
            POST /notification-preferences/meals/test
   At the time chosen for a meal, FoodMart sends one notification
   listing the favourites filed under that meal that can be
   ordered right now.
========================================================= */

type Draft = Record<MealSlot, { enabled: boolean; time: string }>;

export function MealReminders() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["meal-settings"], queryFn: notificationApi.mealSettings });
  const [all, setAll] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<MealSlot | null>(null);

  useEffect(() => {
    if (settings.data) {
      setAll(settings.data.mealAlerts);
      setDraft(settings.data.times);
    }
  }, [settings.data]);

  if (settings.isLoading || !draft) return <Skeleton className="mb-5 h-48" />;
  if (settings.isError) return null;
  const data = settings.data as MealSettings;

  const change = (slot: MealSlot, patch: Partial<Draft[MealSlot]>) => setDraft((d) => (d ? { ...d, [slot]: { ...d[slot], ...patch } } : d));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await notificationApi.saveMealSettings({ mealAlerts: all, times: draft });
      qc.setQueryData(["meal-settings"], saved);
      toast.success("Meal reminders saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const test = async (slot: MealSlot) => {
    setTesting(slot);
    try {
      const res = await notificationApi.testMeal(slot);
      if (res.sent) {
        toast.success("Sent. Check your notifications below.");
        qc.invalidateQueries({ queryKey: ["notifications"] });
      } else toast.info(res.reason || "Nothing to send right now.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setTesting(null);
    }
  };

  return (
    <section id="meals" className="card mb-5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <LuBellRing />
          </span>
          <div>
            <h2 className="font-bold text-navy-900">Meal reminders</h2>
            <p className="text-sm text-ink-600">At your meal time we tell you which favourites for that meal are available. Times are Pakistan time ({data.timeZone}).</p>
          </div>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
          <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={all} onChange={(e) => setAll(e.target.checked)} />
          On
        </label>
      </div>

      {!data.foodAlerts && <p className="mt-3 rounded-xl bg-warning-50 px-3 py-2 text-xs text-warning-600">Food alerts are switched off in your notification settings, so no meal reminders will arrive.</p>}

      <div className={all ? "mt-4 divide-y divide-ink-100" : "mt-4 divide-y divide-ink-100 opacity-50"}>
        {MEALS.map((m) => (
          <div key={m.value} className="flex flex-wrap items-center gap-3 py-2.5">
            <label className="flex min-w-[9.5rem] flex-1 cursor-pointer items-center gap-2 text-sm font-medium text-ink-800">
              <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={draft[m.value].enabled} onChange={(e) => change(m.value, { enabled: e.target.checked })} disabled={!all} />
              <span aria-hidden>{m.emoji}</span> {m.label}
            </label>
            <Input type="time" className="!w-32" value={draft[m.value].time} onChange={(e) => change(m.value, { time: e.target.value })} disabled={!all || !draft[m.value].enabled} aria-label={`${m.label} time`} />
            <Button size="sm" variant="outline" loading={testing === m.value} onClick={() => test(m.value)}>
              Send test
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Button loading={saving} onClick={save}>
          Save reminders
        </Button>
      </div>
    </section>
  );
}
