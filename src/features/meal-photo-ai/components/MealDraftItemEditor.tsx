import { memo } from "react";
import { View } from "react-native";

import { AppButton, AppInput, Typography } from "@/src/components/primitives";

import type { MealPhotoDraftItem, MealPhotoDraftItemErrors } from "../types";

type MealDraftItemEditorProps = {
  errors?: MealPhotoDraftItemErrors;
  item: MealPhotoDraftItem;
  onChange: (field: keyof MealPhotoDraftItem, value: string) => void;
  onRemove: () => void;
};

function MealDraftItemEditorComponent({ errors, item, onChange, onRemove }: MealDraftItemEditorProps) {
  return (
    <View className="gap-4 rounded-2xl border border-border bg-surface-raised p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <Typography variant="labelMd">Food item</Typography>
          <Typography tone="secondary" variant="labelSm">
            Edit the detected food or replace it entirely.
          </Typography>
        </View>
        <AppButton onPress={onRemove} size="sm" variant="danger">
          Remove
        </AppButton>
      </View>

      <AppInput
        autoCapitalize="words"
        error={errors?.name}
        label="Item name"
        onChangeText={(value) => onChange("name", value)}
        placeholder="Chicken breast"
        value={item.name}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppInput
            error={errors?.estimatedQuantity}
            keyboardType="decimal-pad"
            label="Quantity"
            onChangeText={(value) => onChange("estimatedQuantity", value)}
            placeholder="1"
            value={item.estimatedQuantity}
          />
        </View>
        <View className="w-28">
          <AppInput
            error={errors?.servingUnit}
            autoCapitalize="words"
            label="Unit"
            onChangeText={(value) => onChange("servingUnit", value)}
            placeholder="serving"
            value={item.servingUnit}
          />
        </View>
      </View>

      <AppInput
        error={errors?.calories}
        keyboardType="decimal-pad"
        label="Calories"
        onChangeText={(value) => onChange("calories", value)}
        placeholder="250"
        value={item.calories}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppInput
            error={errors?.protein}
            keyboardType="decimal-pad"
            label="Protein"
            onChangeText={(value) => onChange("protein", value)}
            placeholder="30"
            value={item.protein}
          />
        </View>
        <View className="flex-1">
          <AppInput
            error={errors?.carbs}
            keyboardType="decimal-pad"
            label="Carbs"
            onChangeText={(value) => onChange("carbs", value)}
            placeholder="20"
            value={item.carbs}
          />
        </View>
        <View className="flex-1">
          <AppInput
            error={errors?.fat}
            keyboardType="decimal-pad"
            label="Fat"
            onChangeText={(value) => onChange("fat", value)}
            placeholder="10"
            value={item.fat}
          />
        </View>
      </View>
    </View>
  );
}

export const MealDraftItemEditor = memo(MealDraftItemEditorComponent);
