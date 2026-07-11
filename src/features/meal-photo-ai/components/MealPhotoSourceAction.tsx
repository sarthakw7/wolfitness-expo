import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { colors } from "@/src/theme";

type MealPhotoSourceActionProps = {
  accessibilityLabel: string;
  description: string;
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  className?: string;
  onPress: () => void;
  tone?: "primary" | "secondary";
};

function MealPhotoSourceActionComponent({
  accessibilityLabel,
  description,
  disabled = false,
  className,
  icon,
  label,
  onPress,
  tone = "secondary",
}: MealPhotoSourceActionProps) {
  const isPrimary = tone === "primary";

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={cn("justify-between rounded-2xl border px-4 py-4", className, disabled ? "opacity-50" : "opacity-100")}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 196,
        backgroundColor: isPrimary ? colors.emeraldSoft : colors.surfaceRaised,
        borderColor: isPrimary ? colors.emerald : colors.border,
        transform: [{ scale: pressed && !disabled ? 0.985 : 1 }],
      })}
    >
      <View className="flex-1 items-center justify-center gap-4">
        <View
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: isPrimary ? "rgba(255, 255, 255, 0.5)" : colors.surfaceMuted }}
        >
          <Ionicons color={isPrimary ? colors.emerald : colors.graphite} name={icon} size={28} />
        </View>
        <View className="items-center gap-2">
          <Typography align="center" className="text-[22px] font-bold leading-7 tracking-[-0.02em]" variant="labelMd">
            {label}
          </Typography>
          <Typography
            align="center"
            className="uppercase tracking-[0.16em]"
            tone={isPrimary ? "accent" : "secondary"}
            variant="labelSm"
          >
            {description}
          </Typography>
        </View>
      </View>
    </Pressable>
  );
}

export const MealPhotoSourceAction = memo(MealPhotoSourceActionComponent);
