import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";
import { spacing, typography } from "@/src/theme";

function getHashParam(url: string | null, key: string) {
  const hash = url?.split("#")[1];
  if (!hash) return null;
  return new URLSearchParams(hash).get(key);
}

function isStrongEnough(password: string) {
  return password.length >= 8;
}

function createResetRedirectUrl() {
  return AuthSession.makeRedirectUri({
    scheme: "wolfitnessexpo",
    path: "auth/reset-password",
  });
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function UnderlinePasswordInput({
  label,
  onChangeText,
  onBlur,
  placeholder,
  show,
  toggle,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  show: boolean;
  toggle: () => void;
  value: string;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? "#47664b" : "#c2c8bf";

  return (
    <View className="gap-1">
      <Typography className="uppercase tracking-[3px]" style={{ color: "#424842" }} variant="labelSm">
        {label}
      </Typography>
      <View className="relative">
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          blurOnSubmit
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          placeholder={placeholder}
          placeholderTextColor="#c2c8bf"
          returnKeyType="done"
          secureTextEntry={!show}
          selectionColor="#47664b"
          style={{
            borderBottomColor: borderColor,
            borderBottomWidth: 1,
            color: "#1a1c18",
            fontFamily: typography.bodyMd.fontFamily,
            fontSize: typography.bodyMd.fontSize,
            paddingBottom: spacing[2],
            paddingHorizontal: 0,
            paddingRight: 40,
            paddingTop: spacing[1],
          }}
          textContentType="newPassword"
          value={value}
        />
        <Pressable
          accessibilityLabel={show ? "Hide password" : "Show password"}
          accessibilityRole="button"
          className="absolute right-0 top-2"
          hitSlop={8}
          onPress={toggle}
        >
          <Ionicons
            color={show ? "#47664b" : "#5f5e5e"}
            name={show ? "eye-off-outline" : "eye-outline"}
            size={20}
          />
        </Pressable>
      </View>
    </View>
  );
}

function ResetPasswordScreenComponent() {
  const params = useLocalSearchParams<{ code?: string }>();
  const url = Linking.useURL();
  const [phase, setPhase] = useState<"hydrating" | "ready" | "saving" | "done" | "error">("hydrating");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryTouched, setRecoveryTouched] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "sending" | "sent">("idle");

  const canSave = useMemo(() => {
    if (!isSupabaseConfigured) return false;
    if (!isStrongEnough(password)) return false;
    if (password !== confirm) return false;
    return true;
  }, [confirm, password]);

  const passwordError = useMemo(() => {
    if (!passwordTouched) return null;
    if (password.length === 0) return "Password is required.";
    if (!isStrongEnough(password)) return "Password must be at least 8 characters.";
    return null;
  }, [password, passwordTouched]);

  const confirmError = useMemo(() => {
    if (!confirmTouched) return null;
    if (confirm.length === 0) return "Confirm your password.";
    if (confirm !== password) return "Passwords do not match.";
    return null;
  }, [confirm, confirmTouched, password]);

  const recoveryEmailError = useMemo(() => {
    if (!recoveryTouched) return null;
    if (recoveryEmail.trim().length === 0) return "Email is required.";
    if (!isValidEmail(recoveryEmail.trim())) return "Enter a valid email address.";
    return null;
  }, [recoveryEmail, recoveryTouched]);

  useEffect(() => {
    const hydrate = async () => {
      if (!isSupabaseConfigured) {
        setError("Supabase environment variables are not configured.");
        setPhase("error");
        return;
      }

      try {
        const code = typeof params.code === "string" ? params.code : null;
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(exchangeError.message);
            setPhase("error");
            return;
          }
        } else {
          const accessToken = getHashParam(url, "access_token");
          const refreshToken = getHashParam(url, "refresh_token");
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) {
              setError(sessionError.message);
              setPhase("error");
              return;
            }
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
          setPhase("error");
          return;
        }

        if (!data.session) {
          setError("This reset link is invalid or expired. Request a new one from Sign In.");
          setPhase("error");
          return;
        }

        setPhase("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to complete password recovery.");
        setPhase("error");
      }
    };

    hydrate();
  }, [params.code, url]);

  const handleSave = useCallback(async () => {
    if (!canSave) {
      setPasswordTouched(true);
      setConfirmTouched(true);
      return;
    }

    setError(null);
    setPhase("saving");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setPhase("ready");
      return;
    }

    setPhase("done");
  }, [canSave, password]);

  const handleResend = useCallback(async () => {
    setRecoveryTouched(true);
    if (!isSupabaseConfigured) {
      setError("Supabase environment variables are not configured.");
      return;
    }
    if (!isValidEmail(recoveryEmail.trim())) {
      return;
    }

    setError(null);
    setRecoveryStatus("sending");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(recoveryEmail.trim(), {
      redirectTo: createResetRedirectUrl(),
    });
    if (resetError) {
      setError(resetError.message);
      setRecoveryStatus("idle");
      return;
    }

    setRecoveryStatus("sent");
  }, [recoveryEmail]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-[#fafaf2]">
      <ScreenContainer
        scroll
        className="bg-[#fafaf2]"
        contentClassName="flex-grow items-center justify-center px-0 py-0"
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          width: "100%",
        }}
      >
        <View
          className="w-full gap-8"
          style={{
            alignSelf: "center",
            maxWidth: 384,
            width: "100%",
          }}
        >
          <View className="items-center gap-2">
            <Typography align="center" className="text-[#1a1c18]" variant="headlineXl">
              Reset Password
            </Typography>
            <Typography align="center" className="text-[#424842]" variant="bodyMd">
              Choose a new password for your account.
            </Typography>
          </View>

          {phase === "hydrating" ? (
            <Typography align="center" className="text-[#424842]" variant="bodyMd">
              Verifying reset link…
            </Typography>
          ) : null}

          {phase === "error" ? (
            <View className="gap-4">
              <Typography tone="danger" variant="bodyMd">
                {error ?? "Unable to reset your password."}
              </Typography>

              <View className="gap-2">
                <Typography className="uppercase tracking-[3px]" style={{ color: "#424842" }} variant="labelSm">
                  Email
                </Typography>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onBlur={() => setRecoveryTouched(true)}
                  onChangeText={(next) => {
                    setRecoveryEmail(next);
                    setRecoveryStatus("idle");
                    if (error) setError(null);
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor="#c2c8bf"
                  selectionColor="#47664b"
                  style={{
                    borderBottomColor: "#c2c8bf",
                    borderBottomWidth: 1,
                    color: "#1a1c18",
                    fontFamily: typography.bodyMd.fontFamily,
                    fontSize: typography.bodyMd.fontSize,
                    paddingBottom: spacing[2],
                    paddingHorizontal: 0,
                    paddingTop: spacing[1],
                  }}
                  textContentType="emailAddress"
                  value={recoveryEmail}
                />
                {recoveryEmailError ? (
                  <Typography className="mt-1" tone="danger" variant="labelSm">
                    {recoveryEmailError}
                  </Typography>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                className={cn(
                  "w-full items-center justify-center rounded-lg bg-[#86a789] px-6 py-4",
                  recoveryStatus === "sending" ? "opacity-80" : null,
                )}
                disabled={recoveryStatus === "sending"}
                onPress={handleResend}
                style={({ pressed }) => (pressed && recoveryStatus !== "sending" ? { opacity: 0.92 } : null)}
              >
                <Typography
                  align="center"
                  className="uppercase tracking-[3px]"
                  style={[typography.labelSm, { color: "#1f3c25", textTransform: "uppercase" }]}
                  variant="labelSm"
                >
                  {recoveryStatus === "sending"
                    ? "Sending…"
                    : recoveryStatus === "sent"
                      ? "Reset Email Sent"
                      : "Send Another Reset Email"}
                </Typography>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className="w-full items-center justify-center rounded-lg bg-[#86a789] px-6 py-4"
                onPress={() => router.replace("/(auth)/sign-in")}
              >
                <Typography
                  align="center"
                  className="uppercase tracking-[3px]"
                  style={[typography.labelSm, { color: "#1f3c25", textTransform: "uppercase" }]}
                  variant="labelSm"
                >
                  Back to Sign In
                </Typography>
              </Pressable>
            </View>
          ) : null}

          {phase === "ready" || phase === "saving" || phase === "done" ? (
            <View className="gap-6">
              {phase === "done" ? (
                <View className="gap-4">
                  <Typography className="text-[#1a1c18]" variant="bodyLg">
                    Password updated successfully.
                  </Typography>
                  <Pressable
                    accessibilityRole="button"
                    className="w-full items-center justify-center rounded-lg bg-[#86a789] px-6 py-4"
                    onPress={() => router.replace("/")}
                  >
                    <Typography
                      align="center"
                      className="uppercase tracking-[3px]"
                      style={[typography.labelSm, { color: "#1f3c25", textTransform: "uppercase" }]}
                      variant="labelSm"
                    >
                      Continue
                    </Typography>
                  </Pressable>
                </View>
              ) : (
                <>
                  <UnderlinePasswordInput
                    label="New Password"
                    onBlur={() => setPasswordTouched(true)}
                    onChangeText={(next) => {
                      setPassword(next);
                      if (error) setError(null);
                    }}
                    placeholder="Minimum 8 characters"
                    show={showPassword}
                    toggle={() => setShowPassword((v) => !v)}
                    value={password}
                  />
                  {passwordError ? (
                    <Typography className="mt-1" tone="danger" variant="labelSm">
                      {passwordError}
                    </Typography>
                  ) : null}

                  <UnderlinePasswordInput
                    label="Confirm Password"
                    onBlur={() => setConfirmTouched(true)}
                    onChangeText={(next) => {
                      setConfirm(next);
                      if (error) setError(null);
                    }}
                    placeholder="Repeat your password"
                    show={showConfirm}
                    toggle={() => setShowConfirm((v) => !v)}
                    value={confirm}
                  />
                  {confirmError ? (
                    <Typography className="mt-1" tone="danger" variant="labelSm">
                      {confirmError}
                    </Typography>
                  ) : null}

                  {error ? (
                    <Typography tone="danger" variant="bodyMd">
                      {error}
                    </Typography>
                  ) : null}

                  <Pressable
                    accessibilityRole="button"
                    className={cn(
                      "w-full items-center justify-center rounded-lg bg-[#86a789] px-6 py-4",
                      phase === "saving" ? "opacity-80" : null,
                    )}
                    disabled={phase === "saving"}
                    onPress={handleSave}
                    style={({ pressed }) => (pressed && phase !== "saving" ? { opacity: 0.92 } : null)}
                  >
                    <Typography
                      align="center"
                      className="uppercase tracking-[3px]"
                      style={[typography.labelSm, { color: "#1f3c25", textTransform: "uppercase" }]}
                      variant="labelSm"
                    >
                      {phase === "saving" ? "Saving…" : "Update Password"}
                    </Typography>
                  </Pressable>
                </>
              )}
            </View>
          ) : null}
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

export const ResetPasswordScreen = memo(ResetPasswordScreenComponent);
