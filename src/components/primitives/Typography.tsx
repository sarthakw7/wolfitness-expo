import { memo, type ComponentProps } from "react";
import { Text, type TextStyle } from "react-native";

import { cn } from "@/src/lib/cn";
import { colors, typography, type TypographyVariant } from "@/src/theme";

type TypographyProps = ComponentProps<typeof Text> & {
  variant?: TypographyVariant;
  tone?: "primary" | "secondary" | "subtle" | "inverse" | "accent" | "danger";
  align?: "auto" | "left" | "right" | "center" | "justify";
};

const toneColor = {
  primary: colors.graphite,
  secondary: colors.graphiteMuted,
  subtle: colors.graphiteSubtle,
  inverse: colors.white,
  accent: colors.emerald,
  danger: colors.danger,
} as const;

function TypographyComponent({
  align,
  className,
  style,
  tone = "primary",
  variant = "bodyMd",
  ...props
}: TypographyProps) {
  const textStyle: TextStyle = {
    ...typography[variant],
    color: toneColor[tone],
    textAlign: align,
  };

  return (
    <Text
      className={cn("text-graphite", className)}
      style={[textStyle, style]}
      {...props}
    />
  );
}

export const Typography = memo(TypographyComponent);
