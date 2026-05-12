import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, type PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassCard, ScreenContainer, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type ModalSheetProps = PropsWithChildren<{
  eyebrow?: string;
  title: string;
}>;

function ModalSheetComponent({ children, eyebrow, title }: ModalSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <ScreenContainer
      className="justify-end bg-black/20 px-gutter"
      edges={{ bottom: false, top: false }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <GlassCard
          className="gap-6 rounded-t-2xl rounded-b-none px-3 pt-3"
          intensity={24}
          style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}
          tier="floating"
        >
          <View className="items-center">
            <View className="h-1 w-12 rounded-full bg-border-strong" />
          </View>
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              {eyebrow ? (
                <Typography tone="secondary" variant="labelSm">
                  {eyebrow}
                </Typography>
              ) : null}
              <Typography variant="headlineXl">{title}</Typography>
            </View>
            <Pressable
              accessibilityLabel="Close modal"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-muted"
              hitSlop={8}
              onPress={() => router.back()}
            >
              <Ionicons color={colors.graphite} name="close" size={20} />
            </Pressable>
          </View>
          <ScrollView
            alwaysBounceVertical={false}
            contentContainerClassName="gap-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </GlassCard>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function ModalSheetPlaceholder({
  body,
  title,
}: {
  body: string;
  title: string;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-surface-raised p-5">
      <Typography variant="headlineLg">{title}</Typography>
      <Typography tone="secondary" variant="bodyMd">
        {body}
      </Typography>
    </View>
  );
}

export const ModalSheet = Object.assign(memo(ModalSheetComponent), {
  Placeholder: memo(ModalSheetPlaceholder),
});

const styles = StyleSheet.create({
  sheet: {
    maxHeight: "88%",
  },
});
