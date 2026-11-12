import type { MealSlot } from "./types";

/* Meals a favourite dish can be saved under (also used for reminder times). */
export const MEALS: { value: MealSlot; label: string; emoji: string; defaultTime: string }[] = [
  { value: "BREAKFAST", label: "Breakfast (Nashta)", emoji: "🍳", defaultTime: "08:00" },
  { value: "LUNCH", label: "Lunch", emoji: "🍛", defaultTime: "13:00" },
  { value: "DINNER", label: "Dinner", emoji: "🍽️", defaultTime: "20:00" },
  { value: "SNACK", label: "Snack", emoji: "🍟", defaultTime: "17:00" },
  { value: "JUICE", label: "Juice / Drink", emoji: "🥤", defaultTime: "16:00" },
  { value: "DESSERT", label: "Dessert", emoji: "🍨", defaultTime: "21:00" },
];

export const mealName = (slot: string) => (MEALS.find((m) => m.value === slot)?.label || slot).split(" (")[0];
export const mealsText = (slots?: string[]) => (slots?.length ? slots.map(mealName).join(", ") : "");
