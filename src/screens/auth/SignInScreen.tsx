import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { memo, type RefObject, useCallback, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  type PressableStateCallbackType,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { cn } from "@/src/lib/cn";
import { spacing, typography } from "@/src/theme";
import { useAuth } from "@/src/hooks/useAuth";

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

type UnderlineInputProps = {
  accessibilityLabel: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: TextInputProps["autoComplete"];
  blurOnSubmit?: boolean;
  importantForAutofill?: TextInputProps["importantForAutofill"];
  inputRef?: RefObject<TextInput | null>;
  inputMode?: "email" | "text";
  keyboardType?: "default" | "email-address";
  label: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  placeholder: string;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  secureTextEntry?: boolean;
  textContentType?: TextInputProps["textContentType"];
  value: string;
};

function UnderlineInput({
  accessibilityLabel,
  autoCapitalize,
  autoComplete,
  blurOnSubmit = false,
  importantForAutofill,
  inputRef,
  inputMode,
  keyboardType,
  label,
  onChangeText,
  onBlur,
  onSubmitEditing,
  placeholder,
  returnKeyType,
  secureTextEntry,
  textContentType,
  value,
}: UnderlineInputProps) {
  const [focused, setFocused] = useState(false);
  const borderColor = focused ? "#47664b" : "#c2c8bf";

  return (
    <View className="gap-1">
      <Typography
        className="uppercase tracking-[3px]"
        style={{ color: "#424842" }}
        variant="labelSm"
      >
        {label}
      </Typography>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        blurOnSubmit={blurOnSubmit}
        importantForAutofill={importantForAutofill}
        inputMode={inputMode}
        keyboardType={keyboardType}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor="#c2c8bf"
        ref={inputRef}
        returnKeyType={returnKeyType}
        secureTextEntry={secureTextEntry}
        selectionColor="#47664b"
        textContentType={textContentType}
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
        value={value}
      />
    </View>
  );
}

function PrimarySubmitButton({
  disabled,
  isLoading,
  onPress,
  title,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
  title: string;
}) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      accessibilityRole="button"
      className="w-full items-center justify-center rounded-lg bg-[#86a789] px-8 py-4"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }: PressableStateCallbackType) =>
        pressed && !isDisabled ? { opacity: 0.92 } : null
      }
    >
      {isLoading ? (
        <Ionicons color="#1f3c25" name="ellipsis-horizontal" size={20} />
      ) : (
        <Typography
          align="center"
          className="uppercase tracking-[3px]"
          style={[
            typography.labelMd,
            {
              color: "#1f3c25",
              textTransform: "uppercase",
            },
          ]}
          variant="labelMd"
        >
          {title}
        </Typography>
      )}
    </Pressable>
  );
}

function GoogleContinueButton({
  disabled,
  isLoading,
  onPress,
}: {
  disabled?: boolean;
  isLoading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn(
        "w-full flex-row items-center justify-center gap-3 rounded-lg border px-6 py-4",
        disabled ? "opacity-50" : null,
      )}
      disabled={disabled || isLoading}
      style={({ pressed }: PressableStateCallbackType) => [
        {
          backgroundColor: "#ffffff",
          borderColor: "#c2c8bf",
          shadowColor: "#e3e3db",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        pressed && !disabled && !isLoading ? { opacity: 0.92 } : null,
      ]}
      onPress={onPress}
    >
      <Image
        accessibilityIgnoresInvertColors
        source={require("@/assets/images/google-g.png")}
        style={{ height: 20, width: 20 }}
      />
      <Typography
        style={{ color: "#1a1c18" }}
        variant="labelMd"
      >
        Continue with Google
      </Typography>
    </Pressable>
  );
}

function SignInScreenComponent() {
  const { isConfigured, resetPassword, signIn, signInWithGoogle } = useAuth();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<"form" | "google" | "reset" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [didSubmit, setDidSubmit] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const isSubmitting = pendingAction !== null;

  const canSubmit = useMemo(() => {
    if (!isConfigured) return false;
    if (!isValidEmail(email.trim())) return false;
    if (password.length < 8) return false;
    return true;
  }, [email, isConfigured, password.length]);

  const emailError = useMemo(() => {
    if (!emailTouched && !didSubmit) return null;
    if (email.trim().length === 0) return "Email is required.";
    if (!isValidEmail(email.trim())) return "Enter a valid email address.";
    return null;
  }, [didSubmit, email, emailTouched]);

  const passwordError = useMemo(() => {
    if (!passwordTouched && !didSubmit) return null;
    if (password.length === 0) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    return null;
  }, [didSubmit, password.length, passwordTouched]);

  const handleSubmit = useCallback(async () => {
    setDidSubmit(true);
    if (!isValidEmail(email.trim())) {
      // Client-side validation is shown inline; avoid duplicating as a server error.
      setError(null);
      return;
    }
    if (password.length < 8) {
      setError(null);
      return;
    }

    setError(null);
    setSuccess(null);
    setPendingAction("form");
    const result = await signIn({ email, password });
    if (result.error) {
      setError(result.error.message);
    }
    setPendingAction(null);
  }, [email, password, signIn]);

  const handleGoogle = useCallback(async () => {
    setError(null);
    setSuccess(null);
    setPendingAction("google");
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error.message);
    }
    setPendingAction(null);
  }, [signInWithGoogle]);

  const handleForgotPassword = useCallback(async () => {
    if (!isValidEmail(email.trim())) {
      setError("Enter your email first, then request a reset link.");
      return;
    }

    setError(null);
    setPendingAction("reset");
    const result = await resetPassword(email);
    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess("Password reset instructions have been sent.");
    }
    setPendingAction(null);
  }, [email, resetPassword]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-[#fafaf2]"
    >
      <ScreenContainer
        scroll
        className="bg-[#fafaf2]"
        // Override ScreenContainer's default `px-container py-6` frame. We'll provide our own padding via style.
        contentClassName="flex-grow items-center justify-center px-0 py-0"
        contentContainerStyle={{
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 24,
          width: "100%",
        }}
      >
        <View
          className="gap-10"
          style={{
            alignSelf: "center",
            maxWidth: 384,
            width: "100%",
          }}
        >
          <View className="items-center gap-6">
            <View className="h-16 w-16 items-center justify-center">
              <Image
                accessibilityLabel="Wolfitness logo"
                className="h-16 w-16 opacity-90"
                resizeMode="contain"
                source={require("@/assets/images/landing.png")}
              />
            </View>

            <View className="items-center gap-2">
              <Typography align="center" className="text-[#1a1c18]" variant="headlineXl">
                Welcome Back
              </Typography>
              <Typography align="center" className="text-[#424842]" variant="bodyMd">
                Continue your journey to focus and strength.
              </Typography>
            </View>
          </View>

          <View className="gap-6">
            <View className="w-full">
              <UnderlineInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  blurOnSubmit={false}
                  importantForAutofill="yes"
                  inputRef={emailRef}
                  inputMode="email"
                  keyboardType="email-address"
                  label="Email"
                onChangeText={(next) => {
                  setEmail(next);
                  if (error) setError(null);
                  if (success) setSuccess(null);
                }}
                onBlur={() => setEmailTouched(true)}
                onSubmitEditing={() => passwordRef.current?.focus()}
                placeholder="Enter your email"
                returnKeyType="next"
                textContentType="emailAddress"
                value={email}
              />
              {emailError ? (
                <Typography className="mt-1" tone="danger" variant="labelSm">
                  {emailError}
                </Typography>
              ) : null}
            </View>
            <View className="gap-2">
              <View className="relative w-full">
                <UnderlineInput
                  accessibilityLabel="Password"
                  autoCapitalize="none"
                  autoComplete="password"
                  blurOnSubmit
                  importantForAutofill="yes"
                  inputRef={passwordRef}
                  inputMode="text"
                  label="Password"
                  onChangeText={(next) => {
                    setPassword(next);
                    if (error) setError(null);
                    if (success) setSuccess(null);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  onSubmitEditing={() => {
                    if (canSubmit && !isSubmitting) {
                      handleSubmit();
                      return;
                    }
                    passwordRef.current?.blur();
                  }}
                  placeholder="••••••••"
                  returnKeyType="done"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  accessibilityRole="button"
                  className="absolute right-0 top-8"
                  hitSlop={8}
                  onPress={() => setShowPassword((current) => !current)}
                >
                  <Ionicons
                    color={showPassword ? "#47664b" : "#5f5e5e"}
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                  />
                </Pressable>
              </View>
              {passwordError ? (
                <Typography className="mt-1" tone="danger" variant="labelSm">
                  {passwordError}
                </Typography>
              ) : null}
              <Pressable
                accessibilityRole="button"
                className="self-end"
                disabled={!isConfigured || isSubmitting}
                hitSlop={8}
                onPress={handleForgotPassword}
              >
                <Typography
                  align="right"
                  className="uppercase tracking-[2px]"
                  style={{ color: "#737971" }}
                  variant="labelSm"
                >
                  {pendingAction === "reset" ? "Sending reset" : "Forgot password?"}
                </Typography>
              </Pressable>
            </View>

            {error ? (
              <Typography tone="danger" variant="bodyMd">
                {error}
              </Typography>
            ) : null}
            {success ? (
              <Typography tone="accent" variant="bodyMd">
                {success}
              </Typography>
            ) : null}
            {!isConfigured ? (
              <Typography tone="secondary" variant="bodyMd">
                Supabase environment variables are required before authentication can connect.
              </Typography>
            ) : null}

            <PrimarySubmitButton
              disabled={!canSubmit || isSubmitting}
              isLoading={pendingAction === "form"}
              onPress={handleSubmit}
              title="Sign In"
            />
          </View>

          <View className="flex-row items-center py-2">
            <View className="h-px flex-1 bg-[#e3e3db]" />
            <Typography
              className="mx-4 uppercase tracking-[3px]"
              style={{ color: "#737971" }}
              variant="labelSm"
            >
              or
            </Typography>
            <View className="h-px flex-1 bg-[#e3e3db]" />
          </View>

          <GoogleContinueButton
            disabled={!isConfigured || isSubmitting}
            isLoading={pendingAction === "google"}
            onPress={handleGoogle}
          />

          <View className="items-center pt-1">
            <Pressable
              accessibilityRole="button"
              disabled={!isConfigured || isSubmitting}
              hitSlop={8}
              onPress={handleForgotPassword}
            >
              <Typography
                align="center"
                className="uppercase tracking-[3px]"
                style={{ color: "#47664b" }}
                variant="labelSm"
              >
                Reset password
              </Typography>
            </Pressable>
          </View>

          <View className="items-center pt-2">
            <Typography align="center" className="text-[#424842]" variant="bodyMd">
              Don&apos;t have an account?{" "}
              <Link href="/(auth)/sign-up" suppressHighlighting>
                <Typography
                  className="border-b border-[#1a1c18] pb-0.5"
                  style={{ color: "#1a1c18" }}
                  variant="bodyMd"
                >
                  Sign up
                </Typography>
              </Link>
            </Typography>
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

export const SignInScreen = memo(SignInScreenComponent);
