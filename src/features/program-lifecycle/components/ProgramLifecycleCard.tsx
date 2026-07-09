import { View } from "react-native";

import { EditorialCard } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";

type ProgramLifecycleCardProps = {
  badge: string;
  description: string;
  isPrimaryDisabled?: boolean;
  isPrimaryLoading?: boolean;
  isSecondaryDisabled?: boolean;
  isSecondaryLoading?: boolean;
  isTertiaryDisabled?: boolean;
  isTertiaryLoading?: boolean;
  onPrimaryAction: () => void;
  onSecondaryAction?: () => void;
  onTertiaryAction?: () => void;
  primaryActionLabel: string;
  primaryActionVariant?: "primary" | "secondary" | "danger" | "ghost";
  secondaryActionVariant?: "primary" | "secondary" | "danger" | "ghost";
  secondaryActionLabel?: string;
  tertiaryActionLabel?: string;
  tertiaryActionVariant?: "primary" | "secondary" | "danger" | "ghost";
  title: string;
};

export function ProgramLifecycleCard({
  badge,
  description,
  isPrimaryDisabled = false,
  isPrimaryLoading = false,
  isSecondaryDisabled = false,
  isSecondaryLoading = false,
  isTertiaryDisabled = false,
  isTertiaryLoading = false,
  onPrimaryAction,
  onSecondaryAction,
  onTertiaryAction,
  primaryActionLabel,
  primaryActionVariant = "primary",
  secondaryActionVariant = "secondary",
  secondaryActionLabel,
  tertiaryActionLabel,
  tertiaryActionVariant = "ghost",
  title,
}: ProgramLifecycleCardProps) {
  return (
    <EditorialCard className="gap-4">
      <View className="gap-1">
        <Typography tone="secondary" variant="labelSm">
          {badge.toUpperCase()}
        </Typography>
        <Typography variant="headlineLg">{title}</Typography>
        <Typography tone="secondary" variant="bodyMd">
          {description}
        </Typography>
      </View>

      <View className="gap-2">
        <AppButton disabled={isPrimaryDisabled} isLoading={isPrimaryLoading} onPress={onPrimaryAction} variant={primaryActionVariant}>
          {primaryActionLabel}
        </AppButton>
        {secondaryActionLabel && onSecondaryAction ? (
          <AppButton
            disabled={isSecondaryDisabled}
            isLoading={isSecondaryLoading}
            onPress={onSecondaryAction}
            variant={secondaryActionVariant}
          >
            {secondaryActionLabel}
          </AppButton>
        ) : null}
        {tertiaryActionLabel && onTertiaryAction ? (
          <AppButton
            disabled={isTertiaryDisabled}
            isLoading={isTertiaryLoading}
            onPress={onTertiaryAction}
            variant={tertiaryActionVariant}
          >
            {tertiaryActionLabel}
          </AppButton>
        ) : null}
      </View>
    </EditorialCard>
  );
}
