import { memo } from "react";
import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";

type PricingCardProps = {
  ctaLabel?: string;
  ctaLoading?: boolean;
  ctaOnPress?: () => void;
  ctaDisabled?: boolean;
  price: string;
  subtitle?: string;
};

function PricingCardComponent({
  ctaDisabled,
  ctaLabel = "Enroll Now",
  ctaLoading,
  ctaOnPress,
  price,
  subtitle = "Program enrollment is available now. Payment integration can be attached in a later phase.",
}: PricingCardProps) {
  return (
    <EditorialCard className="gap-5">
      <View>
        <Typography tone="secondary" variant="labelSm">
          Program Access
        </Typography>
        <Typography variant="displayLg">{price}</Typography>
      </View>
      <Typography tone="secondary" variant="bodyMd">
        {subtitle}
      </Typography>
      <AppButton
        disabled={ctaDisabled}
        isLoading={ctaLoading}
        onPress={ctaOnPress}
        variant={ctaDisabled ? "ghost" : "secondary"}
      >
        {ctaLabel}
      </AppButton>
    </EditorialCard>
  );
}

export const PricingCard = memo(PricingCardComponent);
