import { memo } from "react";
import { View } from "react-native";

import { AppButton, AppInput, Typography } from "@/src/components/primitives";

import { MealDraftItemEditor } from "./MealDraftItemEditor";
import { MealDraftTotals } from "./MealDraftTotals";
import type { MealPhotoDraft, MealPhotoDraftErrors, MealPhotoDraftItem, MealPhotoDraftTotals } from "../types";

type MealDraftEditorProps = {
  draft: MealPhotoDraft;
  errors?: MealPhotoDraftErrors | null;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateItem: (itemId: string, field: keyof MealPhotoDraftItem, value: string) => void;
  onUpdateMealCategory: (value: string) => void;
  onUpdateMealName: (value: string) => void;
  totals: MealPhotoDraftTotals;
  showValidationErrors?: boolean;
  saveError?: string | null;
};

function MealDraftEditorComponent({
  draft,
  errors,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
  onUpdateMealCategory,
  onUpdateMealName,
  totals,
  saveError,
  showValidationErrors = false,
}: MealDraftEditorProps) {
  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl border border-border bg-surface-raised p-4">
        <Typography variant="headlineLg">Review &amp; Edit</Typography>
        <Typography tone="secondary" variant="bodyMd">
          AI estimate — review before saving.
        </Typography>
      </View>

      {saveError ? (
        <View className="gap-2 rounded-2xl border border-border bg-surface p-4">
          <Typography variant="labelMd">Unable to save meal</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {saveError}
          </Typography>
        </View>
      ) : null}

      {showValidationErrors && errors?.form ? (
        <View className="gap-2 rounded-2xl border border-border bg-surface p-4">
          <Typography variant="labelMd">Check your meal draft</Typography>
          <Typography tone="secondary" variant="bodyMd">
            {errors.form}
          </Typography>
        </View>
      ) : null}

      <View className="gap-4 rounded-2xl border border-border bg-surface-raised p-4">
        <AppInput
          autoCapitalize="words"
          error={showValidationErrors ? errors?.mealName : undefined}
          label="Meal name"
          onChangeText={onUpdateMealName}
          placeholder="Chicken rice bowl"
          value={draft.mealName}
        />
        <AppInput
          autoCapitalize="sentences"
          label="Meal category"
          onChangeText={onUpdateMealCategory}
          placeholder="Lunch, snack, post-workout"
          value={draft.mealCategory}
        />
        <Typography tone="secondary" variant="labelSm">
          Tip: edits stay local until you save.
        </Typography>
      </View>

      <View className="gap-4">
        {draft.items.map((item) => (
          <MealDraftItemEditor
            errors={showValidationErrors ? errors?.items[item.id] : undefined}
            item={item}
            key={item.id}
            onChange={(field, value) => onUpdateItem(item.id, field, value)}
            onRemove={() => onRemoveItem(item.id)}
          />
        ))}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppButton onPress={onAddItem} variant="ghost">
            Add Item
          </AppButton>
        </View>
      </View>

      <MealDraftTotals totals={totals} />
    </View>
  );
}

export const MealDraftEditor = memo(MealDraftEditorComponent);
