import { memo, type PropsWithChildren, type ReactNode } from "react";
import type { ScrollViewProps } from "react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/src/components/primitives";
import { chrome } from "@/src/constants/chrome";
import { cn } from "@/src/lib/cn";
import { spacing } from "@/src/theme";

type ScreenScaffoldProps = PropsWithChildren<{
  bottomChrome?: "none" | "tabs";
  backgroundClassName?: string;
  backgroundColor?: string;
  contentClassName?: string;
  footer?: ReactNode;
  footerClassName?: string;
  footerMode?: "default" | "docked";
  header?: ReactNode;
  refreshControl?: ScrollViewProps["refreshControl"];
  taskMode?: boolean;
}>;

function ScreenScaffoldComponent({
  bottomChrome = "tabs",
  backgroundClassName,
  backgroundColor,
  children,
  contentClassName,
  footer,
  footerClassName,
  footerMode = "default",
  header,
  refreshControl,
  taskMode,
}: ScreenScaffoldProps) {
  const insets = useSafeAreaInsets();
  const contentTop = header
    ? insets.top + chrome.topBarContentHeight + chrome.topBarFloatingGap + spacing[2]
    : insets.top + spacing[3];
  const contentBottom =
    bottomChrome === "tabs"
      ? insets.bottom +
        chrome.bottomTabBarHeight +
        chrome.bottomTabFloatingGap +
        chrome.screenBottomGap
      : insets.bottom + chrome.screenBottomGap;
  const footerOffset = footer
    ? contentBottom + (footerMode === "docked" ? 108 : 148)
    : contentBottom;
  const footerBottom = bottomChrome === "tabs"
    ? insets.bottom + chrome.bottomTabBarHeight + chrome.bottomTabFloatingGap
    : footerMode === "docked"
      ? 0
      : insets.bottom + chrome.screenBottomGap;

  return (
    <View className={cn("relative flex-1", backgroundClassName ?? "bg-surface")} style={{ backgroundColor: backgroundColor ?? undefined }}>
      {header}
      <ScreenContainer
        scroll
        backgroundClassName={backgroundClassName}
        backgroundColor={backgroundColor}
        contentClassName={cn(taskMode ? "gap-5" : "gap-section", contentClassName)}
        contentContainerStyle={{
          paddingBottom: footerOffset,
          paddingTop: contentTop,
        }}
        edges={{ bottom: false, top: false }}
        refreshControl={refreshControl}
      >
        {children}
      </ScreenContainer>
      {footer ? (
        <View
          pointerEvents="box-none"
          className={cn("absolute inset-x-0 z-50 border-t border-border", backgroundClassName ?? "bg-surface", footerClassName)}
          style={{
            bottom: footerBottom,
            elevation: 24,
            paddingBottom: footerMode === "docked" ? insets.bottom + spacing[2] : insets.bottom + chrome.screenBottomGap,
            paddingTop: footerMode === "docked" ? spacing[2] : spacing[3],
            shadowColor: "#000",
            shadowOffset: { height: -4, width: 0 },
            shadowOpacity: footerMode === "docked" ? 0.12 : 0.08,
            shadowRadius: footerMode === "docked" ? 18 : 16,
          }}
        >
          <View className="px-container">{footer}</View>
        </View>
      ) : null}
    </View>
  );
}

export const ScreenScaffold = memo(ScreenScaffoldComponent);
