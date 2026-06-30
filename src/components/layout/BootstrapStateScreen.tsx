import { ActivityIndicator, View } from "react-native";

import { AppButton, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type BootstrapStateScreenProps = {
  actionLabel?: string;
  isLoading?: boolean;
  message: string;
  onAction?: () => void;
  title: string;
};

export function BootstrapStateScreen({
  actionLabel = "Retry",
  isLoading = false,
  message,
  onAction,
  title,
}: BootstrapStateScreenProps) {
  return (
    <View className="flex-1 items-center justify-center bg-surface px-6">
      <View className="w-full max-w-md items-center rounded-3xl border border-border bg-surfaceRaised px-6 py-8">
        {isLoading ? <ActivityIndicator color={colors.graphite} size="large" /> : null}

        <View className={isLoading ? "mt-6 items-center" : "items-center"}>
          <Typography align="center" variant="headlineLg">
            {title}
          </Typography>
          <View className="h-3" />
          <Typography align="center" style={{ color: colors.graphiteMuted }} variant="bodyMd">
            {message}
          </Typography>
        </View>

        {!isLoading && onAction ? (
          <View className="mt-6 w-full">
            <AppButton onPress={onAction} variant="secondary">
              {actionLabel}
            </AppButton>
          </View>
        ) : null}
      </View>
    </View>
  );
}
