import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildMealPhotoDraft,
  calculateMealPhotoDraftTotals,
  cloneMealPhotoDraft,
  createMealPhotoDraftItem,
  hasMealPhotoDraftChanges,
  isMealPhotoDraftValid,
  validateMealPhotoDraft,
} from "../lib/mealPhotoDraft";
import type {
  MealPhotoAnalysis,
  MealPhotoDraft,
  MealPhotoDraftErrors,
  MealPhotoDraftTotals,
} from "../types";

function createDraftSnapshot(analysis: MealPhotoAnalysis | null) {
  return buildMealPhotoDraft(analysis);
}

export function useMealPhotoDraft(analysis: MealPhotoAnalysis | null) {
  const [draft, setDraft] = useState<MealPhotoDraft | null>(() => createDraftSnapshot(analysis));
  const [originalDraft, setOriginalDraft] = useState<MealPhotoDraft | null>(() => createDraftSnapshot(analysis));

  useEffect(() => {
    const nextDraft = createDraftSnapshot(analysis);
    setDraft(nextDraft);
    setOriginalDraft(nextDraft ? cloneMealPhotoDraft(nextDraft) : null);
  }, [analysis]);

  const updateMealName = useCallback((value: string) => {
    setDraft((current) => (current ? { ...current, mealName: value } : current));
  }, []);

  const updateMealCategory = useCallback((value: string) => {
    setDraft((current) => (current ? { ...current, mealCategory: value } : current));
  }, []);

  const updateItem = useCallback((itemId: string, patch: Partial<MealPhotoDraft["items"][number]>) => {
    setDraft((current) => {
      if (!current) return current;

      return {
        ...current,
        items: current.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
      };
    });
  }, []);

  const addItem = useCallback(() => {
    setDraft((current) => {
      const nextItem = createMealPhotoDraftItem();
      if (!current) {
        return {
          items: [nextItem],
          mealCategory: "",
          mealName: "",
        };
      }

      return {
        ...current,
        items: [...current.items, nextItem],
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.filter((item) => item.id !== itemId),
      };
    });
  }, []);

  const resetToAiEstimate = useCallback(() => {
    setDraft(cloneMealPhotoDraft(originalDraft));
  }, [originalDraft]);

  const totals: MealPhotoDraftTotals = useMemo(() => calculateMealPhotoDraftTotals(draft), [draft]);
  const validationErrors: MealPhotoDraftErrors = useMemo(() => validateMealPhotoDraft(draft), [draft]);
  const isValid = useMemo(() => isMealPhotoDraftValid(validationErrors), [validationErrors]);
  const hasUnsavedChanges = useMemo(() => hasMealPhotoDraftChanges(draft, originalDraft), [draft, originalDraft]);

  return {
    addItem,
    draft,
    hasUnsavedChanges,
    isValid,
    resetToAiEstimate,
    totals,
    updateItem,
    updateMealCategory,
    updateMealName,
    validationErrors,
    removeItem,
  };
}
