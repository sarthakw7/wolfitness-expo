import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";

import type { MealPhotoItem } from "../types";

type MealAnalysisItemProps = {
  item: MealPhotoItem;
};

function formatQuantity(item: MealPhotoItem) {
  if (typeof item.estimatedQuantity !== "number" || !Number.isFinite(item.estimatedQuantity)) return null;
  const quantity = Number.isInteger(item.estimatedQuantity)
    ? item.estimatedQuantity.toString()
    : item.estimatedQuantity.toFixed(1);
  return `${quantity}${item.servingUnit ? ` ${item.servingUnit}` : ""}`;
}

function MealAnalysisItemComponent({ item }: MealAnalysisItemProps) {
  const quantity = formatQuantity(item);

  return (
    <View className="gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Typography variant="bodyMd">{item.name}</Typography>
          {quantity ? (
            <Typography tone="secondary" variant="labelSm">
              {quantity}
            </Typography>
          ) : null}
        </View>
        <Typography variant="labelMd">{Math.round(item.calories)} kcal</Typography>
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <Typography tone="secondary" variant="labelSm">
          P {Math.round(item.protein)}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          C {Math.round(item.carbs)}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          F {Math.round(item.fat)}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          {item.confidence} confidence
        </Typography>
      </View>
    </View>
  );
}

export const MealAnalysisItem = memo(MealAnalysisItemComponent);
