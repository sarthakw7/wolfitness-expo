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
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";

import {
  assertSupabaseConfigured,
  isSupabaseConfigured,
  supabase,
} from "@/src/lib/supabase";
import { commitOnboardingDraftToSupabase } from "@/src/lib/commit-onboarding-draft";
import { normalizeEmail } from "@/src/lib/normalize-email";
import { queryClient } from "@/src/lib/query-client";
import { queryKeys } from "@/src/hooks/queries/queryKeys";

WebBrowser.maybeCompleteAuthSession();

type AuthCredentials = {
  email: string;
  password: string;
};

type SignUpCredentials = AuthCredentials & {
  fullName?: string;
};

type OnboardingStatus = "complete" | "incomplete" | "unknown";

type AuthContextValue = {
  refreshOnboardingStatus: () => Promise<void>;
  error: string | null;
  isAuthenticated: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  isOnboardingComplete: boolean;
  onboardingStatus: OnboardingStatus;
  session: Session | null;
  signIn: (credentials: AuthCredentials) => Promise<{ error: AuthError | Error | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | Error | null }>;
  signOut: () => Promise<{ error: AuthError | Error | null }>;
  signUp: (credentials: SignUpCredentials) => Promise<{ error: AuthError | Error | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | Error | null }>;
  user: User | null;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

async function tryCommitOnboardingDraft(userId: string) {
  const { committed } = await commitOnboardingDraftToSupabase(userId);
  if (committed) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardOverview(userId) }),
    ]);
  }
  return committed;
}

async function getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  console.info("[auth-debug] onboarding check start", { userId });
  const [fitness, assessment] = await Promise.all([
    supabase
      .from("fitness_profiles")
      .select("user_id,gender,date_of_birth,primary_goal")
      .eq("user_id", userId)
      .limit(1),
    supabase.from("onboarding_assessments").select("id").eq("user_id", userId).limit(1),
  ]);
  console.info("[auth-debug] profile fetch", {
    error: fitness.error?.message,
    rows: fitness.data?.length ?? 0,
    userId,
  });
  console.info("[auth-debug] assessment fetch", {
    error: assessment.error?.message,
    rows: assessment.data?.length ?? 0,
    userId,
  });

  if (fitness.error || assessment.error) {
    console.warn("[auth] Unable to verify onboarding completion. Preserving authenticated route state.", {
      assessmentError: assessment.error?.message,
      fitnessError: fitness.error?.message,
      userId,
    });
    return "unknown";
  }

  const fitnessProfile = Array.isArray(fitness.data) ? fitness.data[0] : null;
  const hasCompletedFitnessProfile = Boolean(
    fitnessProfile?.gender && fitnessProfile.date_of_birth && fitnessProfile.primary_goal,
  );
  const hasAssessment = Array.isArray(assessment.data) && assessment.data.length > 0;
  const status = hasCompletedFitnessProfile && hasAssessment ? "complete" : "incomplete";

  console.info("[auth-debug] onboarding check end", {
    hasAssessment,
    hasCompletedFitnessProfile,
    status,
    userId,
  });

  return status;
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
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus>("unknown");
  const hydrationSeqRef = useRef(0);
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : "Supabase environment variables are not configured.",
  );

  const hydrateOnboarding = useCallback(async (nextSession: Session | null) => {
    console.info("[auth-debug] hydration start", {
      hasSession: Boolean(nextSession),
      userId: nextSession?.user?.id ?? null,
    });
    if (!nextSession?.user?.id) {
      setOnboardingStatus("incomplete");
      console.info("[auth-debug] hydration end", {
        status: "incomplete",
        userId: null,
      });
      return;
    }

    const nextStatus = await getOnboardingStatus(nextSession.user.id);
    setOnboardingStatus(nextStatus);
    console.info("[auth-debug] hydration end", {
      status: nextStatus,
      userId: nextSession.user.id,
    });
  }, []);

  const hydrateSessionState = useCallback(
    async (nextSession: Session | null, reason: string, options: { commitDraft?: boolean } = {}) => {
      const seq = hydrationSeqRef.current + 1;
      hydrationSeqRef.current = seq;
      setIsLoading(true);
      console.info("[auth-debug] hydration pipeline start", {
        hasSession: Boolean(nextSession),
        reason,
        seq,
        userId: nextSession?.user?.id ?? null,
      });

      try {
        if (nextSession?.user?.id && options.commitDraft) {
          try {
            const committed = await tryCommitOnboardingDraft(nextSession.user.id);
            console.info("[auth-debug] onboarding draft commit result", {
              committed,
              reason,
              seq,
              userId: nextSession.user.id,
            });
          } catch (commitError: unknown) {
            setError(commitError instanceof Error ? commitError.message : "Unable to commit onboarding draft.");
            console.warn("[auth] Unable to commit onboarding draft.", {
              error: commitError instanceof Error ? commitError.message : String(commitError),
              reason,
              seq,
              userId: nextSession.user.id,
            });
          }
        }

        await hydrateOnboarding(nextSession);
      } catch (hydrationError: unknown) {
        setError(hydrationError instanceof Error ? hydrationError.message : "Unable to hydrate onboarding state.");
        console.warn("[auth] Unable to hydrate onboarding state.", {
          error: hydrationError instanceof Error ? hydrationError.message : String(hydrationError),
          reason,
          seq,
          userId: nextSession?.user?.id ?? null,
        });
      } finally {
        if (mountedRef.current && hydrationSeqRef.current === seq) {
          setIsLoading(false);
        }
        console.info("[auth-debug] hydration pipeline end", {
          reason,
          seq,
          userId: nextSession?.user?.id ?? null,
        });
      }
    },
    [hydrateOnboarding],
  );

  useEffect(() => {
    mountedRef.current = true;
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
        console.warn("[auth] Unable to restore auth session during startup.", {
          error: sessionError.message,
        });
      }

      setSession(data.session);
      await hydrateSessionState(data.session, "startup");
    };

    hydrateSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.info("[auth-debug] session changed", {
        event,
        hasSession: Boolean(nextSession),
        userId: nextSession?.user?.id ?? null,
      });
      if (event === "INITIAL_SESSION") {
        return;
      }
      setSession(nextSession);
      setIsLoading(true);
      setTimeout(() => {
        if (!mountedRef.current) return;
        hydrateSessionState(nextSession, `auth:${event}`, { commitDraft: Boolean(nextSession?.user?.id) });
      }, 0);
    });

    return () => {
      isMounted = false;
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [hydrateSessionState]);

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
      console.info("[auth-debug] sign in start", { email: normalizeEmail(email) });
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (authError) {
        setError(authError.message);
      }
      console.info("[auth-debug] sign in end", {
        email: normalizeEmail(email),
        hasError: Boolean(authError),
      });
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
      console.info("[auth-debug] sign up start", { email: normalizeEmail(email) });
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizeEmail(email),
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
      console.info("[auth-debug] sign up end", {
        email: normalizeEmail(email),
        hasError: Boolean(authError),
        hasSession: Boolean(data.session),
      });
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
      const { error: authError } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
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
      setOnboardingStatus("incomplete");
      return { error: authError };
    } catch (authError) {
      const normalized = authError instanceof Error ? authError : new Error("Unable to sign out.");
      setError(normalized.message);
      return { error: normalized };
    }
  }, []);

  const refreshOnboardingStatus = useCallback(async () => {
    await hydrateSessionState(session, "manual-refresh");
  }, [hydrateSessionState, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      refreshOnboardingStatus,
      error,
      isAuthenticated: Boolean(session),
      isConfigured: isSupabaseConfigured,
      isLoading,
      isOnboardingComplete: onboardingStatus === "complete",
      onboardingStatus,
      session,
      signIn,
      signInWithGoogle,
      signOut,
      signUp,
      resetPassword,
      user: session?.user ?? null,
    }),
    [
      error,
      isLoading,
      onboardingStatus,
      refreshOnboardingStatus,
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
