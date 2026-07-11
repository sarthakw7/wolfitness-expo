import type {
  MealPhotoAnalysis,
  MealPhotoDraft,
  MealPhotoDraftErrors,
  MealPhotoDraftItem,
  MealPhotoDraftItemErrors,
  MealPhotoDraftTotals,
  MealPhotoItem,
} from "../types";

function makeDraftId() {
  return `meal-item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatNumericValue(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "";
  }

  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return rounded.replace(/\.0$/, "");
}

function parseNumericValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildDraftItem(item: MealPhotoItem): MealPhotoDraftItem {
  return {
    calories: formatNumericValue(item.calories),
    carbs: formatNumericValue(item.carbs),
    estimatedQuantity: formatNumericValue(item.estimatedQuantity),
    fat: formatNumericValue(item.fat),
    id: item.id || makeDraftId(),
    name: item.name,
    protein: formatNumericValue(item.protein),
    servingUnit: item.servingUnit ?? "",
  };
}

export function buildMealPhotoDraft(analysis: MealPhotoAnalysis | null): MealPhotoDraft | null {
  if (!analysis) return null;

  return {
    items: analysis.items.map(buildDraftItem),
    mealCategory: "",
    mealName: analysis.mealName,
  };
}

export function cloneMealPhotoDraft(draft: MealPhotoDraft | null): MealPhotoDraft | null {
  if (!draft) return null;

  return {
    items: draft.items.map((item) => ({ ...item })),
    mealCategory: draft.mealCategory,
    mealName: draft.mealName,
  };
}

export function hasMealPhotoDraftChanges(
  draft: MealPhotoDraft | null,
  originalDraft: MealPhotoDraft | null,
) {
  return JSON.stringify(draft) !== JSON.stringify(originalDraft);
}

export function createMealPhotoDraftItem(): MealPhotoDraftItem {
  return {
    calories: "0",
    carbs: "0",
    estimatedQuantity: "",
    fat: "0",
    id: makeDraftId(),
    name: "",
    protein: "0",
    servingUnit: "",
  };
}

export function calculateMealPhotoDraftTotals(draft: MealPhotoDraft | null): MealPhotoDraftTotals {
  const items = draft?.items ?? [];

  return items.reduce<MealPhotoDraftTotals>(
    (totals, item) => {
      const calories = parseNumericValue(item.calories);
      const carbs = parseNumericValue(item.carbs);
      const fat = parseNumericValue(item.fat);
      const protein = parseNumericValue(item.protein);

      return {
        calories: totals.calories + Math.max(0, calories ?? 0),
        carbs: totals.carbs + Math.max(0, carbs ?? 0),
        fat: totals.fat + Math.max(0, fat ?? 0),
        protein: totals.protein + Math.max(0, protein ?? 0),
      };
    },
    { calories: 0, carbs: 0, fat: 0, protein: 0 },
  );
}

function createItemErrors(): MealPhotoDraftItemErrors {
  return {};
}

export function validateMealPhotoDraft(draft: MealPhotoDraft | null): MealPhotoDraftErrors {
  const errors: MealPhotoDraftErrors = { items: {} };

  if (!draft) {
    errors.form = "Add a meal before saving.";
    return errors;
  }

  if (!draft.mealName.trim()) {
    errors.mealName = "Meal name is required.";
  }

  if (draft.items.length === 0) {
    errors.form = "Add at least one food item.";
  }

  draft.items.forEach((item) => {
    const itemErrors = createItemErrors();
    const name = item.name.trim();

    if (!name) {
      itemErrors.name = "Item name is required.";
    }

    const quantityText = item.estimatedQuantity.trim();
    if (quantityText) {
      const quantity = parseNumericValue(quantityText);
      if (quantity == null || quantity < 0) {
        itemErrors.estimatedQuantity = "Enter a non-negative number.";
      }
    }

    const calorieText = item.calories.trim();
    const calories = parseNumericValue(calorieText);
    if (calorieText === "" || calories == null || calories < 0) {
      itemErrors.calories = "Enter a non-negative number.";
    }

    const proteinText = item.protein.trim();
    const protein = parseNumericValue(proteinText);
    if (proteinText === "" || protein == null || protein < 0) {
      itemErrors.protein = "Enter a non-negative number.";
    }

    const carbsText = item.carbs.trim();
    const carbs = parseNumericValue(carbsText);
    if (carbsText === "" || carbs == null || carbs < 0) {
      itemErrors.carbs = "Enter a non-negative number.";
    }

    const fatText = item.fat.trim();
    const fat = parseNumericValue(fatText);
    if (fatText === "" || fat == null || fat < 0) {
      itemErrors.fat = "Enter a non-negative number.";
    }

    if (Object.keys(itemErrors).length > 0) {
      errors.items[item.id] = itemErrors;
    }
  });

  return errors;
}

export function isMealPhotoDraftValid(errors: MealPhotoDraftErrors) {
  const hasItemErrors = Object.values(errors.items).some((itemErrors) => Object.keys(itemErrors).length > 0);
  return !errors.form && !errors.mealName && !errors.mealCategory && !hasItemErrors;
}
