import { memo } from "react";
import { View } from "react-native";

import { Typography } from "@/src/components/primitives";

type SmartSyncStatusBannerProps = {
  body: string;
  title: string;
};

function SmartSyncStatusBannerComponent({ body, title }: SmartSyncStatusBannerProps) {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface-raised p-4">
      <Typography variant="labelMd">{title}</Typography>
      <Typography tone="secondary" variant="bodyMd">
        {body}
      </Typography>
    </View>
  );
}

export const SmartSyncStatusBanner = memo(SmartSyncStatusBannerComponent);
