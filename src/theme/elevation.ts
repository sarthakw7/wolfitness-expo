import { Platform, type ViewStyle } from "react-native";

import { colors } from "./colors";

type ElevationTier = "none" | "glass" | "floating" | "interactive";

const iosShadow = (
  shadowOpacity: number,
  shadowRadius: number,
  shadowOffsetHeight: number,
): ViewStyle => ({
  shadowColor: colors.graphite,
  shadowOpacity,
  shadowRadius,
  shadowOffset: { width: 0, height: shadowOffsetHeight },
});

export const elevation: Record<ElevationTier, ViewStyle> = {
  none: {},
  glass: Platform.select<ViewStyle>({
    ios: iosShadow(0.04, 20, 10),
    android: { elevation: 2 },
    default: {},
  }),
  floating: Platform.select<ViewStyle>({
    ios: iosShadow(0.04, 40, 20),
    android: { elevation: 6 },
    default: {},
  }),
  interactive: Platform.select<ViewStyle>({
    ios: iosShadow(0.07, 48, 24),
    android: { elevation: 8 },
    default: {},
  }),
};

export type ElevationTierName = keyof typeof elevation;
