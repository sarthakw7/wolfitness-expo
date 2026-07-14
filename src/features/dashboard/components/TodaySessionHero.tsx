import { Ionicons } from "@expo/vector-icons";
import { ImageBackground, View } from "react-native";

import { Chip } from "@/src/components/layout";
import { AppButton, GlassCard, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

type TodaySessionHeroProps = {
  cta: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
  };
  focus: string;
  heroImage: string;
  load: string;
  onPressCta: () => void;
  sessionMinutes: number;
  title: string;
};

export function TodaySessionHero({
  cta,
  focus,
  heroImage,
  load,
  onPressCta,
  sessionMinutes,
  title,
}: TodaySessionHeroProps) {
  return (
    <View className="min-h-[420px] overflow-hidden rounded-3xl bg-surface-muted">
      <ImageBackground
        accessibilityLabel="Daily workout editorial image"
        source={{ uri: heroImage }}
        style={{ flex: 1, justifyContent: "flex-end", padding: 12 }}
      >
        <GlassCard className="gap-4" intensity={18}>
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1 gap-1">
              <Typography tone="secondary" variant="labelSm">
                {"TODAY'S SESSION"}
              </Typography>
              <Typography variant="headlineXl">
                {title}
              </Typography>
            </View>
            <Chip label={`${sessionMinutes} MIN`} />
          </View>
          <View className="flex-row gap-8">
            <View>
              <Typography tone="secondary" variant="labelSm">
                Focus
              </Typography>
              <Typography variant="bodyMd">{focus}</Typography>
            </View>
            <View>
              <Typography tone="secondary" variant="labelSm">
                Status
              </Typography>
              <Typography variant="bodyMd">{load}</Typography>
            </View>
          </View>
          <AppButton iconLeft={<Ionicons color={colors.white} name={cta.icon} size={16} />} onPress={onPressCta}>
            {cta.label === "Start Today's Workout" ? "Begin Protocol" : cta.label}
          </AppButton>
        </GlassCard>
      </ImageBackground>
    </View>
  );
}
