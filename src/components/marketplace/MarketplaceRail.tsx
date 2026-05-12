import { memo, type PropsWithChildren, type ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { SectionTitle } from "@/src/components/layout";

type MarketplaceRailProps = PropsWithChildren<{
  action?: ReactNode;
  subtitle?: string;
  title: string;
}>;

function MarketplaceRailComponent({
  action,
  children,
  subtitle,
  title,
}: MarketplaceRailProps) {
  return (
    <View className="gap-4">
      <SectionTitle action={action} subtitle={subtitle} title={title} />
      <ScrollView
        alwaysBounceHorizontal={false}
        contentContainerClassName="gap-gutter pr-container"
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

export const MarketplaceRail = memo(MarketplaceRailComponent);
