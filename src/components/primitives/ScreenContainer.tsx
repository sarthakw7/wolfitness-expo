import { memo, type PropsWithChildren } from "react";
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
  View,
  type ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { cn } from "@/src/lib/cn";
import { colors, spacing } from "@/src/theme";

type ScreenContainerProps = PropsWithChildren<
  ViewProps & {
    backgroundClassName?: string;
    backgroundColor?: string;
    edges?: Partial<Record<"top" | "bottom", boolean>>;
    scroll?: false;
  }
>;

type ScrollScreenContainerProps = PropsWithChildren<
  ScrollViewProps & {
    backgroundClassName?: string;
    backgroundColor?: string;
    contentClassName?: string;
    contentContainerStyle?: StyleProp<ViewStyle>;
    edges?: Partial<Record<"top" | "bottom", boolean>>;
    scroll: true;
  }
>;

function ScreenContainerComponent(
  props: ScreenContainerProps | ScrollScreenContainerProps,
) {
  const insets = useSafeAreaInsets();
  const edges = props.edges ?? { bottom: true, top: true };
  const paddingTop = edges.top ? insets.top : 0;
  const paddingBottom = edges.bottom ? insets.bottom : 0;

  if (props.scroll) {
    const {
      backgroundClassName,
      backgroundColor,
      children,
      className,
      contentClassName,
      contentContainerStyle,
      edges: _edges,
      style,
      scroll,
      ...rest
    } = props;

    return (
      <ScrollView
        alwaysBounceVertical={false}
        className={cn("flex-1", backgroundClassName ?? "bg-surface", className)}
        contentContainerClassName={cn("px-container py-6", contentClassName)}
        contentContainerStyle={[
          {
            paddingBottom: paddingBottom + spacing[3],
            paddingTop: paddingTop + spacing[3],
          },
          contentContainerStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={[{ backgroundColor: backgroundColor ?? colors.surface }, style]}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  const { backgroundClassName, backgroundColor, children, className, edges: _edges, scroll, style, ...rest } = props;

  return (
    <View
      className={cn("flex-1 px-container", backgroundClassName ?? "bg-surface", className)}
      style={[
        {
          backgroundColor: backgroundColor ?? colors.surface,
          paddingBottom,
          paddingTop,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export const ScreenContainer = memo(ScreenContainerComponent);
