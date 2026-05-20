import { memo, type ReactNode, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

import { cn } from "@/src/lib/cn";
import { colors, radius, typography } from "@/src/theme";

import { Typography } from "./Typography";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type AppButtonSize = "sm" | "md" | "lg";

type AppButtonProps = Omit<PressableProps, "children" | "style"> & {
  children: ReactNode;
  className?: string;
  iconLeft?: ReactNode;
  isLoading?: boolean;
  size?: AppButtonSize;
  style?: StyleProp<ViewStyle>;
  variant?: AppButtonVariant;
};

const variantStyles = StyleSheet.create({
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.border,
  },
  primary: {
    backgroundColor: colors.graphite,
    borderColor: colors.graphite,
  },
  secondary: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
});

const sizeStyles = StyleSheet.create({
  lg: {
    minHeight: 56,
    paddingHorizontal: 24,
  },
  md: {
    minHeight: 48,
    paddingHorizontal: 20,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: 16,
  },
});

function AppButtonComponent({
  accessibilityRole = "button",
  children,
  className,
  disabled,
  iconLeft,
  isLoading,
  size = "md",
  style,
  variant = "primary",
  ...props
}: AppButtonProps) {
  const labelTone = variant === "ghost" ? "primary" : "inverse";
  const isDisabled = disabled || isLoading;
  const pressableStyle = useMemo(
    () => {
      return ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        style,
      ];
    },
    [isDisabled, size, style, variant],
  );

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      className={cn("flex-row items-center justify-center gap-2 rounded-lg", className)}
      disabled={isDisabled}
      style={pressableStyle}
      {...props}
    >
      {isLoading ? <ActivityIndicator color={variant === "ghost" ? colors.graphite : colors.white} /> : iconLeft}
      <View pointerEvents="none">
        <Typography
          align="center"
          tone={labelTone}
          variant="labelMd"
          style={typography.labelMd}
        >
          {children}
        </Typography>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});

export const AppButton = memo(AppButtonComponent);
