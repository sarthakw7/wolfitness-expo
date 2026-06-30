import type { AuthError, Session, User } from "@supabase/supabase-js";
import * as Sentry from "@sentry/react-native";
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
import { isAthleteOnboardingComplete } from "@/src/lib/onboarding-completion";
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
type BootstrapPhase = "checking-setup" | "error" | "ready" | "restoring-session";

type AuthContextValue = {
  bootstrapError: string | null;
  bootstrapPhase: BootstrapPhase;
  refreshOnboardingStatus: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
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

type OnboardingFitnessProfileRow = {
  date_of_birth: string | null;
  equipment_access: string[] | null;
  experience_level: string | null;
  gender: string | null;
  height_cm: number | null;
  primary_goal: string | null;
  training_availability: string[] | null;
  weight_kg: number | null;
};

type OnboardingAssessmentRow = {
  id: string;
  raw_answers: Record<string, unknown> | null;
};

function debugAuth(message: string, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.info("[auth-debug]", message, context ?? {});
  }
}

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
  debugAuth("onboarding check start", { userId });
  const [fitness, assessment] = await Promise.all([
    supabase
      .from("fitness_profiles")
      .select(
        "gender,date_of_birth,primary_goal,experience_level,training_availability,equipment_access,height_cm,weight_kg",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("onboarding_assessments")
      .select("id,raw_answers")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  debugAuth("profile fetch", {
    error: fitness.error?.message,
    hasProfile: Boolean(fitness.data),
    userId,
  });
  debugAuth("assessment fetch", {
    error: assessment.error?.message,
    hasAssessment: Boolean(assessment.data),
    userId,
  });

  if (fitness.error || assessment.error) {
    const onboardingError = new Error("Unable to verify onboarding completion.");
    console.warn("[auth] Unable to verify onboarding completion.", {
      assessmentError: assessment.error?.message,
      fitnessError: fitness.error?.message,
      userId,
    });
    Sentry.captureException(onboardingError, {
      extra: {
        assessmentError: assessment.error?.message ?? null,
        fitnessError: fitness.error?.message ?? null,
        userId,
      },
      tags: {
        area: "auth-bootstrap",
      },
    });
    throw onboardingError;
  }

  const fitnessProfile = (fitness.data as OnboardingFitnessProfileRow | null) ?? null;
  const latestAssessment = (assessment.data as OnboardingAssessmentRow | null) ?? null;
  const status = isAthleteOnboardingComplete(fitnessProfile, latestAssessment)
    ? "complete"
    : "incomplete";

  debugAuth("onboarding check end", {
    hasAssessment: Boolean(latestAssessment?.id),
    hasCompletedFitnessProfile: status === "complete",
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
  const [bootstrapPhase, setBootstrapPhase] = useState<BootstrapPhase>("restoring-session");
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const hydrationSeqRef = useRef(0);
  const mountedRef = useRef(true);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : "Supabase environment variables are not configured.",
  );

  const hydrateOnboarding = useCallback(async (nextSession: Session | null) => {
    debugAuth("hydration start", {
      hasSession: Boolean(nextSession),
      userId: nextSession?.user?.id ?? null,
    });
    if (!nextSession?.user?.id) {
      setOnboardingStatus("incomplete");
      setBootstrapPhase("ready");
      debugAuth("hydration end", {
        status: "incomplete",
        userId: null,
      });
      return;
    }

    setBootstrapPhase("checking-setup");
    const nextStatus = await getOnboardingStatus(nextSession.user.id);
    setOnboardingStatus(nextStatus);
    setBootstrapPhase("ready");
    debugAuth("hydration end", {
      status: nextStatus,
      userId: nextSession.user.id,
    });
  }, []);

  const hydrateSessionState = useCallback(
    async (nextSession: Session | null, reason: string, options: { commitDraft?: boolean } = {}) => {
      const seq = hydrationSeqRef.current + 1;
      hydrationSeqRef.current = seq;
      setIsLoading(true);
      setBootstrapError(null);
      setBootstrapPhase(nextSession?.user?.id ? "checking-setup" : "restoring-session");
      debugAuth("hydration pipeline start", {
        hasSession: Boolean(nextSession),
        reason,
        seq,
        userId: nextSession?.user?.id ?? null,
      });

      try {
        if (nextSession?.user?.id && options.commitDraft) {
          try {
            const committed = await tryCommitOnboardingDraft(nextSession.user.id);
            debugAuth("onboarding draft commit result", {
              committed,
              reason,
              seq,
              userId: nextSession.user.id,
            });
          } catch (commitError: unknown) {
            setError(commitError instanceof Error ? commitError.message : "Unable to commit onboarding draft.");
            setBootstrapError("We couldn't finish restoring your account setup.");
            setBootstrapPhase("error");
            console.warn("[auth] Unable to commit onboarding draft.", {
              error: commitError instanceof Error ? commitError.message : String(commitError),
              reason,
              seq,
              userId: nextSession.user.id,
            });
            Sentry.captureException(commitError instanceof Error ? commitError : new Error(String(commitError)), {
              extra: {
                reason,
                seq,
                userId: nextSession.user.id,
              },
              tags: {
                area: "auth-bootstrap",
              },
            });
          }
        }

        await hydrateOnboarding(nextSession);
      } catch (hydrationError: unknown) {
        const message =
          hydrationError instanceof Error ? hydrationError.message : "Unable to hydrate onboarding state.";
        setError(message);
        setBootstrapError("We couldn't verify your account setup.");
        setBootstrapPhase("error");
        console.warn("[auth] Unable to hydrate onboarding state.", {
          error: message,
          reason,
          seq,
          userId: nextSession?.user?.id ?? null,
        });
        Sentry.captureException(
          hydrationError instanceof Error ? hydrationError : new Error(String(hydrationError)),
          {
            extra: {
              reason,
              seq,
              userId: nextSession?.user?.id ?? null,
            },
            tags: {
              area: "auth-bootstrap",
            },
          },
        );
      } finally {
        if (mountedRef.current && hydrationSeqRef.current === seq) {
          setIsLoading(false);
        }
        debugAuth("hydration pipeline end", {
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
      setBootstrapPhase("error");
      setBootstrapError("Wolfitness is missing required configuration.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const restoreSession = async (reason: string) => {
      setIsLoading(true);
      setBootstrapError(null);
      setBootstrapPhase("restoring-session");
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        setError(sessionError.message);
        setBootstrapError("We couldn't restore your session.");
        setBootstrapPhase("error");
        setOnboardingStatus("unknown");
        setIsLoading(false);
        console.warn("[auth] Unable to restore auth session during startup.", {
          reason,
          error: sessionError.message,
        });
        Sentry.captureException(sessionError, {
          extra: {
            reason,
          },
          tags: {
            area: "auth-bootstrap",
          },
        });
        return;
      }

      setSession(data.session);
      await hydrateSessionState(data.session, reason);
    };

    restoreSession("startup");

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      debugAuth("session changed", {
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
      debugAuth("sign in start", { email: normalizeEmail(email) });
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (authError) {
        setError(authError.message);
      }
      debugAuth("sign in end", {
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
      debugAuth("sign up start", { email: normalizeEmail(email) });
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
      debugAuth("sign up end", {
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
      debugAuth("oauth redirect uri", { redirectTo });

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

  const retryBootstrap = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setBootstrapError("Wolfitness is missing required configuration.");
      setBootstrapPhase("error");
      setIsLoading(false);
      return;
    }

    setError(null);
    setBootstrapError(null);
    setBootstrapPhase("restoring-session");
    setIsLoading(true);

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw sessionError;
      }

      setSession(data.session);
      await hydrateSessionState(data.session, "manual-retry");
    } catch (retryError: unknown) {
      const message = retryError instanceof Error ? retryError.message : "Unable to restore your session.";
      setError(message);
      setBootstrapError("We couldn't restore your session.");
      setBootstrapPhase("error");
      setIsLoading(false);
      console.warn("[auth] Bootstrap retry failed.", {
        error: message,
      });
      Sentry.captureException(retryError instanceof Error ? retryError : new Error(String(retryError)), {
        tags: {
          area: "auth-bootstrap",
        },
      });
    }
  }, [hydrateSessionState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      bootstrapError,
      bootstrapPhase,
      refreshOnboardingStatus,
      retryBootstrap,
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
      bootstrapError,
      bootstrapPhase,
      error,
      isLoading,
      onboardingStatus,
      refreshOnboardingStatus,
      retryBootstrap,
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
