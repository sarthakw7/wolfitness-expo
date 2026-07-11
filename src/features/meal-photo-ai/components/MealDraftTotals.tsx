import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";

import type { MealPhotoDraftTotals } from "../types";

type MealDraftTotalsProps = {
  totals: MealPhotoDraftTotals;
};

function MealDraftTotalsComponent({ totals }: MealDraftTotalsProps) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-surface-muted p-4">
      <View className="gap-1">
        <Typography variant="labelMd">Estimated totals</Typography>
        <Typography tone="secondary" variant="labelSm">
          AI estimate — review before saving.
        </Typography>
      </View>
      <View className="flex-row flex-wrap gap-4">
        <Typography tone="secondary" variant="labelSm">
          Calories {Math.round(totals.calories)}
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          Protein {Math.round(totals.protein)}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          Carbs {Math.round(totals.carbs)}g
        </Typography>
        <Typography tone="secondary" variant="labelSm">
          Fat {Math.round(totals.fat)}g
        </Typography>
      </View>
    </View>
  );
}

export const MealDraftTotals = memo(MealDraftTotalsComponent);

