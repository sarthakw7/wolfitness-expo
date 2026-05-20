import { Link } from "expo-router";
import { memo } from "react";
import {
  Image,
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  View,
} from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { typography } from "@/src/theme";

type LandingButtonProps = Omit<PressableProps, "children"> & {
  children: string;
  variant: "primary" | "outline";
};

function LandingButton({
  children,
  className,
  style,
  variant,
  ...props
}: LandingButtonProps) {
  return (
    <Pressable
      accessibilityRole={props.accessibilityRole ?? "button"}
      className={cn(
        "w-full max-w-[320px] items-center justify-center rounded-lg px-8 py-4",
        variant === "primary"
          ? "bg-[#1a1c18]"
          : "border bg-transparent border-[#86a789]",
        className,
      )}
      style={(state: PressableStateCallbackType) => {
        const pressedStyle = state.pressed ? { opacity: 0.92 } : null;
        const userStyle =
          typeof style === "function" ? style(state) : style;
        return [pressedStyle, userStyle];
      }}
      {...props}
    >
      <Typography
        align="center"
        className="tracking-[2px]"
        style={[
          typography.labelSm,
          {
            color: variant === "primary" ? "#ffffff" : "#47664b",
            textTransform: "uppercase",
          },
        ]}
        // tone only provides defaults; explicit color above is what matters.
        tone={variant === "primary" ? "inverse" : "primary"}
        variant="labelSm"
      >
        {children}
      </Typography>
    </Pressable>
  );
}

function AuthLandingScreenComponent() {
  return (
    <ScreenContainer className="flex-1 bg-[#fafaf2] py-16">
      <View className="flex-1 items-center justify-between">
        {/* Top Logo Anchor */}
        <View className="items-center pb-12">
          <Image
            accessibilityLabel="Wolfitness logo"
            className="h-16 w-16 opacity-90"
            resizeMode="contain"
            source={require("@/assets/images/landing.png")}
          />
        </View>

        {/* Main Hero Canvas */}
        <View className="items-center gap-4 px-4 text-center">
          <Typography
            align="center"
            className="text-[#1a1c18]"
            style={{ letterSpacing: -0.4 }}
            variant="displayLg"
          >
            Strength in Stillness.
          </Typography>
          <Typography
            align="center"
            className="max-w-[340px] text-[#5f5e5e]"
            variant="bodyLg"
          >
            The modern performance operating system for the mindful athlete.
          </Typography>
        </View>

        {/* Action Stack */}
        <View className="w-full items-center gap-4 pt-12">
          <Link href="/(preauth-onboarding)" asChild>
            <LandingButton variant="primary">GET STARTED</LandingButton>
          </Link>
          <Link href="/(auth)/sign-in" asChild>
            <LandingButton variant="outline">SIGN IN</LandingButton>
          </Link>
        </View>
      </View>
    </ScreenContainer>
  );
}

export const AuthLandingScreen = memo(AuthLandingScreenComponent);
