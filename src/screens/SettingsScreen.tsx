import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { memo, useCallback, useMemo } from "react";
import { Alert, Linking, Pressable, View } from "react-native";

import { AppTopBar, EditorialCard, ScreenScaffold } from "@/src/components/layout";
import { AppButton, Typography } from "@/src/components/primitives";
import { useAuth } from "@/src/hooks/useAuth";
import { useProfile } from "@/src/hooks/queries";
import { colors } from "@/src/theme";

type SettingsRowProps = {
  danger?: boolean;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

function SettingsRow({ danger = false, description, icon, label, onPress }: SettingsRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <View className="flex-row items-center gap-4 rounded-2xl border border-border bg-surface-muted p-4">
        <View className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface">
          <Ionicons color={danger ? colors.danger : colors.graphiteMuted} name={icon} size={18} />
        </View>

        <View className="flex-1 gap-1">
          <Typography tone={danger ? "danger" : "primary"} variant="headlineLg">
            {label}
          </Typography>
          <Typography tone="secondary" variant="bodyMd">
            {description}
          </Typography>
        </View>

        <Ionicons color={colors.graphiteMuted} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

function SettingsScreenComponent() {
  const { signOut, user } = useAuth();
  const profileQuery = useProfile();
  const publicProfile = profileQuery.data?.publicProfile ?? null;

  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() ?? "";
  const privacyUrl = process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() ?? "";
  const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL?.trim() ?? "";

  const athleteEmail =
    publicProfile?.email ??
    user?.email ??
    ((user?.user_metadata?.email as string | undefined) ?? null);

  const athleteId = user?.id ?? publicProfile?.id ?? null;

  const openExternalUrl = useCallback(async (url: string, failureMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Unable to open link", failureMessage);
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open link", failureMessage);
    }
  }, []);

  const handleEditProfile = useCallback(() => {
    router.push("/(modals)/edit-profile");
  }, []);

  const handleSupport = useCallback(() => {
    if (!supportEmail) {
      Alert.alert(
        "Support unavailable",
        "Support email is not configured for this build yet. Set EXPO_PUBLIC_SUPPORT_EMAIL before release.",
      );
      return;
    }

    const subject = encodeURIComponent("Wolfitness support");
    const body = encodeURIComponent(
      [
        "Hi Wolfitness Support,",
        "",
        `Account email: ${athleteEmail ?? "Unavailable"}`,
        `Account id: ${athleteId ?? "Unavailable"}`,
        "",
        "Describe your issue here:",
      ].join("\n"),
    );

    openExternalUrl(
      `mailto:${supportEmail}?subject=${subject}&body=${body}`,
      "Your device could not open the support email composer.",
    ).catch(() => {});
  }, [athleteEmail, athleteId, openExternalUrl, supportEmail]);

  const handlePrivacy = useCallback(() => {
    if (!privacyUrl) {
      Alert.alert("Privacy Policy unavailable", "Privacy Policy is not configured for this build.");
      return;
    }

    openExternalUrl(
      privacyUrl,
      "Your device could not open the privacy policy link.",
    ).catch(() => {});
  }, [openExternalUrl, privacyUrl]);

  const handleTerms = useCallback(() => {
    if (!termsUrl) {
      Alert.alert("Terms unavailable", "Terms of Service is not configured for this build.");
      return;
    }

    openExternalUrl(
      termsUrl,
      "Your device could not open the terms of service link.",
    ).catch(() => {});
  }, [openExternalUrl, termsUrl]);

  const handleDeleteAccountRequest = useCallback(() => {
    Alert.alert(
      "Request account deletion?",
      "This app does not permanently delete your account from the client yet. We can open an email request instead.",
      [
        { style: "cancel", text: "Cancel" },
        {
          text: "Request Deletion",
          style: "destructive",
          onPress: () => {
            if (!supportEmail) {
              Alert.alert(
                "Support unavailable",
                "Support email is not configured for this build yet. Set EXPO_PUBLIC_SUPPORT_EMAIL before release.",
              );
              return;
            }

            const subject = encodeURIComponent("Delete account request");
            const body = encodeURIComponent(
              [
                "Hi Wolfitness Support,",
                "",
                "I would like to request deletion of my account.",
                "",
                `Account email: ${athleteEmail ?? "Unavailable"}`,
                `Account id: ${athleteId ?? "Unavailable"}`,
              ].join("\n"),
            );

            openExternalUrl(
              `mailto:${supportEmail}?subject=${subject}&body=${body}`,
              "Your device could not open the deletion request email composer.",
            ).catch(() => {});
          },
        },
      ],
    );
  }, [athleteEmail, athleteId, openExternalUrl, supportEmail]);

  const handleSignOut = useCallback(() => {
    Alert.alert("Sign out?", "You will need to sign in again to continue training.", [
      { style: "cancel", text: "Cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  }, [signOut]);

  const legalHint = useMemo(() => {
    if (!privacyUrl && !termsUrl) {
      return "Privacy and terms links are not configured for this build yet.";
    }

    if (!privacyUrl || !termsUrl) {
      return "One or more legal links are not configured for this build yet.";
    }

    return "Privacy and terms links are configured for this build.";
  }, [privacyUrl, termsUrl]);

  return (
    <ScreenScaffold bottomChrome="none" contentClassName="gap-6" header={<AppTopBar back title="Settings" />}>
      <View className="gap-6 px-2">
        <EditorialCard className="gap-3">
          <Typography tone="secondary" variant="labelSm">
            ACCOUNT
          </Typography>
          <Typography variant="headlineLg">Manage your account</Typography>
          <Typography tone="secondary" variant="bodyMd">
            Update profile details, reach support, review legal links, or sign out safely.
          </Typography>
          {athleteEmail ? (
            <Typography tone="secondary" variant="labelSm">
              Signed in as {athleteEmail}
            </Typography>
          ) : null}
        </EditorialCard>

        <EditorialCard className="gap-3">
          <SettingsRow
            description="Update your name or profile photo."
            icon="person-circle-outline"
            label="Edit Profile"
            onPress={handleEditProfile}
          />
          <SettingsRow
            description={
              supportEmail
                ? `Email ${supportEmail} for account or app support.`
                : "Support email is not configured yet for this build."
            }
            icon="mail-outline"
            label="Support"
            onPress={handleSupport}
          />
          <SettingsRow
            description={legalHint}
            icon="document-text-outline"
            label="Privacy Policy"
            onPress={handlePrivacy}
          />
          <SettingsRow
            description={legalHint}
            icon="reader-outline"
            label="Terms of Service"
            onPress={handleTerms}
          />
        </EditorialCard>

        <EditorialCard className="gap-3">
          <SettingsRow
            danger
            description="Email support to request permanent account deletion."
            icon="trash-outline"
            label="Delete Account Request"
            onPress={handleDeleteAccountRequest}
          />
          <View className="pt-2">
            <AppButton
              iconLeft={<Ionicons color={colors.white} name="log-out-outline" size={18} />}
              onPress={handleSignOut}
              variant="primary"
            >
              Sign Out
            </AppButton>
          </View>
        </EditorialCard>
      </View>
    </ScreenScaffold>
  );
}

export const SettingsScreen = memo(SettingsScreenComponent);
