import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthError, Session, User } from "@supabase/supabase-js";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  createContext,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

import {
  assertSupabaseConfigured,
  isSupabaseConfigured,
  supabase,
} from "@/src/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

const ONBOARDING_STORAGE_PREFIX = "wolfitness:onboarding-complete";

type AuthCredentials = {
  email: string;
  password: string;
};

type SignUpCredentials = AuthCredentials & {
  fullName?: string;
};

type AuthContextValue = {
  completeOnboarding: () => Promise<void>;
  error: string | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  session: Session | null;
  signIn: (credentials: AuthCredentials) => Promise<{ error: AuthError | Error | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function onboardingStorageKey(userId: string) {
  return `${ONBOARDING_STORAGE_PREFIX}:${userId}`;
}

async function readOnboardingComplete(userId: string) {
  const stored = await AsyncStorage.getItem(onboardingStorageKey(userId));
  return stored === "true";
}

function createRedirectUrl(path: "auth/callback" | "auth/reset-password" = "auth/callback") {
  return AuthSession.makeRedirectUri({
    scheme: "wolfitnessexpo",
    path,
  });
}

function getOAuthCode(url: string) {
  const parsed = Linking.parse(url);
  const code = parsed.queryParams?.code;
  return typeof code === "string" ? code : null;
}

function getHashParam(url: string, key: string) {
  const hash = url.split("#")[1];
  if (!hash) {
    return null;
  }
  return new URLSearchParams(hash).get(key);
}

function AuthProviderComponent({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : "Supabase environment variables are not configured.",
  );

  const hydrateOnboarding = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user?.id) {
      setIsOnboardingComplete(false);
      return;
    }

    const complete = await readOnboardingComplete(nextSession.user.id);
    setIsOnboardingComplete(complete);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const hydrateSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
      }

      setSession(data.session);
      await hydrateOnboarding(data.session);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      hydrateOnboarding(nextSession).catch((hydrationError: unknown) => {
        setError(hydrationError instanceof Error ? hydrationError.message : "Unable to hydrate onboarding state.");
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateOnboarding]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: AuthCredentials) => {
    try {
      assertSupabaseConfigured();
      setError(null);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(authError.message);
      }
      return { error: authError };
    } catch (authError) {
      const normalized = authError instanceof Error ? authError : new Error("Unable to sign in.");
      setError(normalized.message);
      return { error: normalized };
    }
  }, []);

  const signUp = useCallback(async ({ email, fullName, password }: SignUpCredentials) => {
    try {
      assertSupabaseConfigured();
      setError(null);
      const { error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        options: fullName?.trim()
          ? {
              data: {
                full_name: fullName.trim(),
              },
            }
          : undefined,
        password,
      });
      if (authError) {
        setError(authError.message);
      }
      return { error: authError };
    } catch (authError) {
      const normalized = authError instanceof Error ? authError : new Error("Unable to create account.");
      setError(normalized.message);
      return { error: normalized };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      assertSupabaseConfigured();
      setError(null);
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: createRedirectUrl("auth/reset-password"),
      });
      if (authError) {
        setError(authError.message);
      }
      return { error: authError };
    } catch (authError) {
      const normalized = authError instanceof Error ? authError : new Error("Unable to send reset email.");
      setError(normalized.message);
      return { error: normalized };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      assertSupabaseConfigured();
      setError(null);

      const redirectTo = createRedirectUrl();
      console.log("👉 Mobile Redirect URI:", redirectTo);

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
        provider: "google",
      });

      if (oauthError) {
        setError(oauthError.message);
        return { error: oauthError };
      }

      if (!data.url) {
        const missingUrlError = new Error("Google sign in did not return an authorization URL.");
        setError(missingUrlError.message);
        return { error: missingUrlError };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type !== "success") {
        const cancelledError = new Error("Google sign in was cancelled.");
        return { error: cancelledError };
      }

      const code = getOAuthCode(result.url);

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
        }
        return { error: exchangeError };
      }

      const accessToken = getHashParam(result.url, "access_token");
      const refreshToken = getHashParam(result.url, "refresh_token");

      if (accessToken && refreshToken) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setSessionError) {
          setError(setSessionError.message);
        }
        return { error: setSessionError };
      }

      const missingCodeError = new Error("Google sign in completed without a session code.");
      setError(missingCodeError.message);
      return { error: missingCodeError };
    } catch (authError) {
      const normalized = authError instanceof Error ? authError : new Error("Unable to sign in with Google.");
      setError(normalized.message);
      return { error: normalized };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      assertSupabaseConfigured();
      setError(null);
      const { error: authError } = await supabase.auth.signOut();
      if (authError) {
        setError(authError.message);
      }
      setSession(null);
      setIsOnboardingComplete(false);
      return { error: authError };
    } catch (authError) {
      const normalized = authError instanceof Error ? authError : new Error("Unable to sign out.");
      setError(normalized.message);
      return { error: normalized };
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    await AsyncStorage.setItem(onboardingStorageKey(session.user.id), "true");
    setIsOnboardingComplete(true);
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      completeOnboarding,
      error,
      isAuthenticated: Boolean(session),
      isConfigured: isSupabaseConfigured,
      isLoading,
      isOnboardingComplete,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      resetPassword,
      user: session?.user ?? null,
    }),
    [
      completeOnboarding,
      error,
      isLoading,
      isOnboardingComplete,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const AuthProvider = memo(AuthProviderComponent);
