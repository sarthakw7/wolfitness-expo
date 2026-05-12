import { memo, type PropsWithChildren, type ReactNode } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenContainer } from "@/src/components/primitives";
import { chrome } from "@/src/constants/chrome";
import { cn } from "@/src/lib/cn";
import { spacing } from "@/src/theme";

type ScreenScaffoldProps = PropsWithChildren<{
  bottomChrome?: "none" | "tabs";
  contentClassName?: string;
  footer?: ReactNode;
  header?: ReactNode;
  taskMode?: boolean;
}>;

function ScreenScaffoldComponent({
  bottomChrome = "tabs",
  children,
  contentClassName,
  footer,
  header,
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

  return (
    <View className="flex-1 bg-surface">
      {header}
      <ScreenContainer
        scroll
        className="bg-surface"
        contentClassName={cn(taskMode ? "gap-5" : "gap-section", contentClassName)}
        contentContainerStyle={{
          paddingBottom: contentBottom,
          paddingTop: contentTop,
        }}
        edges={{ bottom: false, top: false }}
      >
        {children}
      </ScreenContainer>
      {footer}
    </View>
  );
}

export const ScreenScaffold = memo(ScreenScaffoldComponent);
