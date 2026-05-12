import { memo } from "react";
import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";

type PricingCardProps = {
  price: string;
};

function PricingCardComponent({ price }: PricingCardProps) {
  return (
    <EditorialCard className="gap-5">
      <View>
        <Typography tone="secondary" variant="labelSm">
          Program Access
        </Typography>
        <Typography variant="displayLg">{price}</Typography>
      </View>
      <Typography tone="secondary" variant="bodyMd">
        Enrollment and payment logic will attach here in a later business phase.
      </Typography>
      <AppButton>Enrollment Contract</AppButton>
    </EditorialCard>
  );
}

export const PricingCard = memo(PricingCardComponent);
