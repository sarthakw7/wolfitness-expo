import { Redirect, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useState } from "react";

import { ScreenContainer, Typography } from "@/src/components/primitives";
import { isSupabaseConfigured, supabase } from "@/src/lib/supabase";

function getHashParam(url: string | null, key: string) {
  const hash = url?.split("#")[1];
  if (!hash) {
    return null;
  }
  return new URLSearchParams(hash).get(key);
}

export default function AuthCallbackRoute() {
  const params = useLocalSearchParams<{ code?: string }>();
  const url = Linking.useURL();
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hydrateFromCallback = async () => {
      if (!isSupabaseConfigured) {
        setError("Supabase environment variables are not configured.");
        setIsComplete(true);
        return;
      }

      const code = typeof params.code === "string" ? params.code : null;

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        setError(exchangeError?.message ?? null);
        setIsComplete(true);
        return;
      }

      const accessToken = getHashParam(url, "access_token");
      const refreshToken = getHashParam(url, "refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        setError(sessionError?.message ?? null);
      }

      setIsComplete(true);
    };

    hydrateFromCallback();
  }, [params.code, url]);

  if (isComplete && !error) {
    return <Redirect href="/" />;
  }

  return (
    <ScreenContainer className="justify-center gap-3">
      <Typography variant="headlineXl">Completing Sign In</Typography>
      {error ? (
        <Typography tone="danger" variant="bodyMd">
          {error}
        </Typography>
      ) : (
        <Typography tone="secondary" variant="bodyMd">
          Securing your mobile session.
        </Typography>
      )}
    </ScreenContainer>
  );
}
