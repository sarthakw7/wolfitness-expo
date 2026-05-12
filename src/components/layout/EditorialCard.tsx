import { memo, type PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { cn } from "@/src/lib/cn";
import { colors, elevation, radius } from "@/src/theme";

type EditorialCardProps = PropsWithChildren<
  ViewProps & {
    tone?: "solid" | "muted";
  }
>;

function EditorialCardComponent({
  children,
  className,
  style,
  tone = "solid",
  ...props
}: EditorialCardProps) {
  return (
    <View
      className={cn("rounded-2xl border border-border bg-surface-raised p-5", className)}
      style={[styles.card, tone === "muted" ? styles.muted : null, elevation.floating, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    borderWidth: StyleSheet.hairlineWidth,
  },
  muted: {
    backgroundColor: colors.surfaceMuted,
  },
});

export const EditorialCard = memo(EditorialCardComponent);
