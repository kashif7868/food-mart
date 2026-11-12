"use client";

import { useEffect, useState } from "react";

import { Button, Chip, Modal } from "@/components/ui";
import { MEALS } from "@/lib/meals";
import type { MealSlot } from "@/lib/types";

/* =========================================================
   "Which meal is this favourite for?"
   Opens right after a dish is saved (or from "Edit meals").
   The reminder at the user's meal time only includes dishes
   filed under that meal.
========================================================= */

export function MealPickerModal({
  open,
  onClose,
  initial,
  dishName,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: MealSlot[];
  dishName?: string;
  onSave: (slots: MealSlot[]) => Promise<boolean | void> | void;
}) {
  const [picked, setPicked] = useState<MealSlot[]>(initial);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (open) setPicked(initial);
  }, [open, initial]);

  const toggle = (slot: MealSlot) => setPicked((cur) => (cur.includes(slot) ? cur.filter((s) => s !== slot) : [...cur, slot]));
  const save = async () => {
    setSaving(true);
    try {
      const ok = await onSave(picked);
      if (ok !== false) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Which meal is this for?"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <Button loading={saving} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">
        {dishName ? <b>{dishName}</b> : "This dish"} is saved. Pick the meals you like it for and we will remind you at your meal time when it is available.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {MEALS.map((m) => (
          <Chip key={m.value} active={picked.includes(m.value)} onClick={() => toggle(m.value)}>
            <span aria-hidden>{m.emoji}</span> {m.label}
          </Chip>
        ))}
      </div>
    </Modal>
  );
}

/* Wires a useFavorite() result to the picker. Render it OUTSIDE any <Link> so clicks inside do not navigate. */
export function FavoriteMealPicker({
  fav,
  name,
}: {
  fav: { pickerOpen: boolean; closePicker: () => void; slots: MealSlot[]; saveSlots: (s: MealSlot[]) => Promise<boolean> };
  name?: string;
}) {
  return <MealPickerModal open={fav.pickerOpen} onClose={fav.closePicker} initial={fav.slots} dishName={name} onSave={fav.saveSlots} />;
}
