import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo } from "react";
import { ImageBackground, View } from "react-native";

import {
  AppButton,
  GlassCard,
  Typography,
} from "@/src/components/primitives";
import {
  AppTopBar,
  Chip,
  EditorialCard,
  ScreenScaffold,
  SectionTitle,
  StatCard,
} from "@/src/components/layout";
import { CoachCard, MarketplaceRail, ProgramCard } from "@/src/components/marketplace";
import { colors } from "@/src/theme";
import {
  marketplaceCoaches,
  marketplacePrograms,
} from "@/src/constants/marketplace";

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4Lt7B2pUHplBybkn77mauDPD2uknpPW3rz2oPP-1P15sQRnQvEGqUrIdVsdqLWAFEJVUL8zT_RpiKhx6kcefATW7OQddv8jMkxL2nOCh58Bchxc3-waMAp_9tCOLZXBEYxgCog2SHQ0e1X8Sxl2fSAV4JWzu7xNG9DetNYrOtRpam2-8m4Nl7zczbI_uboD2SrpHBMcO2xWB5k-K2E5qAEy3nQzXy-9hJT1jmv1STgrgro3chu6Q6ADmU6w6k943_wALFo7uVVbXX";

function AthleteDashboardScreenComponent() {
  return (
    <ScreenScaffold header={<AppTopBar />}>
      <View className="gap-2">
        <Typography tone="secondary" variant="labelSm">
          Performance Protocol
        </Typography>
        <Typography variant="displayLg">Precision Training.</Typography>
      </View>

      <View className="gap-gutter">
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
                    Today&apos;s Session
                  </Typography>
                  <Typography variant="headlineXl">Hypertrophy Base II</Typography>
                </View>
                <Chip label="60 Min" />
              </View>
              <View className="flex-row gap-8">
                <View>
                  <Typography tone="secondary" variant="labelSm">
                    Focus
                  </Typography>
                  <Typography variant="bodyMd">Lower Body Power</Typography>
                </View>
                <View>
                  <Typography tone="secondary" variant="labelSm">
                    Load
                  </Typography>
                  <Typography variant="bodyMd">85% 1RM</Typography>
                </View>
              </View>
              <AppButton iconLeft={<Ionicons color={colors.white} name="arrow-forward" size={16} />}>
                Begin Protocol
              </AppButton>
            </GlassCard>
          </ImageBackground>
        </View>

        <View className="gap-gutter">
          <StatCard
            icon="flame-outline"
            label="Energy Expenditure"
            progress={0.82}
            trend="Daily Goal 3,000 kcal"
            unit="kcal"
            value="2,450"
          />
          <EditorialCard className="gap-6">
            <SectionTitle title="Weekly Consistency" />
            <View className="flex-row items-end justify-between">
              {[0.3, 0.8, 1, 0.6, 0.9, 0.45, 0.7].map((value, index) => (
                <View className="items-center gap-2" key={index}>
                  <View className="h-14 w-8 justify-end rounded-full bg-surface-muted p-1">
                    <View
                      className="w-full rounded-full bg-emerald"
                      style={{ height: `${value * 100}%` }}
                    />
                  </View>
                  <Typography tone="secondary" variant="labelSm">
                    {"MTWTFSS"[index]}
                  </Typography>
                </View>
              ))}
            </View>
          </EditorialCard>
        </View>
      </View>

      <View className="gap-section">
        <MarketplaceRail
          action={
            <Link href="/(marketplace)" asChild>
              <AppButton size="sm" variant="ghost">Explore</AppButton>
            </Link>
          }
          subtitle="Coach-led blocks selected for your current training rhythm."
          title="Featured Programs"
        >
          {marketplacePrograms.slice(0, 3).map((program) => (
            <ProgramCard compact key={program.id} program={program} />
          ))}
        </MarketplaceRail>

        <MarketplaceRail
          subtitle="Specialists behind the premium protocol library."
          title="Elite Coaches"
        >
          {marketplaceCoaches.map((coach) => (
            <CoachCard coach={coach} key={coach.id} />
          ))}
        </MarketplaceRail>
      </View>
    </ScreenScaffold>
  );
}

export const AthleteDashboardScreen = memo(AthleteDashboardScreenComponent);
