import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { ImageBackground, View } from "react-native";

import { GlassCard, Typography } from "@/src/components/primitives";
import { colors } from "@/src/theme";

const authHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuD4Lt7B2pUHplBybkn77mauDPD2uknpPW3rz2oPP-1P15sQRnQvEGqUrIdVsdqLWAFEJVUL8zT_RpiKhx6kcefATW7OQddv8jMkxL2nOCh58Bchxc3-waMAp_9tCOLZXBEYxgCog2SHQ0e1X8Sxl2fSAV4JWzu7xNG9DetNYrOtRpam2-8m4Nl7zczbI_uboD2SrpHBMcO2xWB5k-K2E5qAEy3nQzXy-9hJT1jmv1STgrgro3chu6Q6ADmU6w6k943_wALFo7uVVbXX";

type AuthHeroProps = {
  eyebrow: string;
  subtitle: string;
  title: string;
  image?: string;
};

function AuthHeroComponent({
  eyebrow,
  image = authHeroImage,
  subtitle,
  title,
}: AuthHeroProps) {
  return (
    <View className="min-h-[330px] overflow-hidden rounded-3xl bg-surface-muted shadow-luxury">
      <ImageBackground
        accessibilityLabel="Athlete editorial background"
        source={{ uri: image }}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <View className="absolute inset-0 bg-black/10" />
        <View className="p-4">
          <GlassCard className="gap-3" intensity={18}>
            <Typography tone="secondary" variant="labelSm">
              {eyebrow}
            </Typography>
            <Typography variant="displayLg">{title}</Typography>
            <Typography tone="secondary" variant="bodyLg">
              {subtitle}
            </Typography>
          </GlassCard>
        </View>
      </ImageBackground>
    </View>
  );
}

export const AuthHero = memo(AuthHeroComponent);
