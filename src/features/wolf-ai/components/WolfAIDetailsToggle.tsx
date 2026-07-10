import { memo, useState, type ReactNode } from "react";
import { View } from "react-native";

import { AppButton } from "@/src/components/primitives";

type WolfAIDetailsToggleProps = {
  details: ReactNode;
  detailsLabel?: string;
  initiallyExpanded?: boolean;
  summary: ReactNode;
};

function WolfAIDetailsToggleComponent({
  details,
  detailsLabel = "View details",
  initiallyExpanded = false,
  summary,
}: WolfAIDetailsToggleProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <View className="gap-2">
      {summary}
      <View className="gap-2">
        <AppButton
          className="self-start"
          onPress={() => setIsExpanded((value) => !value)}
          size="sm"
          variant="ghost"
        >
          {isExpanded ? "Hide details" : detailsLabel}
        </AppButton>

        {isExpanded ? <View className="gap-2">{details}</View> : null}
      </View>
    </View>
  );
}

export const WolfAIDetailsToggle = memo(WolfAIDetailsToggleComponent);
