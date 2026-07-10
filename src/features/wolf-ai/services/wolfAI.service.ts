import { supabase } from "@/src/lib/supabase";
import { buildWolfitnessApiUrl } from "@/src/config/apiUrls";

import { WOLF_AI_ERROR_MESSAGES } from "../constants";
import { WolfAIError } from "../types";
import type { WolfAIFeature, WolfAIGenerateResponse, WolfAIErrorCode, WolfAIUsageResponse } from "../types";

function normalizeWolfAIError(error: unknown): WolfAIError {
  if (error instanceof WolfAIError) return error;
  if (error instanceof TypeError) {
    return new WolfAIError(WOLF_AI_ERROR_MESSAGES.network, "NETWORK_ERROR");
  }
  if (error instanceof Error) {
    return new WolfAIError(error.message || WOLF_AI_ERROR_MESSAGES.unknown, "INTERNAL_ERROR");
  }
  return new WolfAIError(WOLF_AI_ERROR_MESSAGES.unknown, "INTERNAL_ERROR");
}

async function resolveWolfAiSession() {
  const firstSession = await supabase.auth.getSession();
  if (firstSession.error) {
    throw firstSession.error;
  }

  if (firstSession.data.session?.access_token) {
    return firstSession.data.session;
  }

  if (__DEV__) {
    console.info("[Wolf AI]", "No access token found. Attempting session refresh.");
  }

  const refreshedSession = await supabase.auth.refreshSession();
  if (refreshedSession.error) {
    throw refreshedSession.error;
  }

  if (refreshedSession.data.session?.access_token) {
    return refreshedSession.data.session;
  }

  const secondSession = await supabase.auth.getSession();
  if (secondSession.error) {
    throw secondSession.error;
  }

  if (secondSession.data.session?.access_token) {
    return secondSession.data.session;
  }

  throw new WolfAIError(WOLF_AI_ERROR_MESSAGES.authentication, "UNAUTHORIZED");
}

function parseUsage(input: unknown): WolfAIUsageResponse | null {
  if (!input || typeof input !== "object") return null;
  const candidate = input as Partial<WolfAIUsageResponse>;

  if (
    typeof candidate.limit !== "number" ||
    typeof candidate.remaining !== "number" ||
    typeof candidate.tier !== "string"
    || typeof candidate.used !== "number"
  ) {
    return null;
  }

  return {
    isLimitReached: Boolean((candidate as { isLimitReached?: boolean }).isLimitReached) || candidate.remaining <= 0,
    limit: candidate.limit,
    remaining: candidate.remaining,
    tier: candidate.tier as WolfAIUsageResponse["tier"],
    used: candidate.used,
  };
}

export async function generateWolfAI<TData = unknown>(input: {
  feature: WolfAIFeature;
  forceRefresh?: boolean;
}): Promise<WolfAIGenerateResponse<TData>> {
  try {
    const session = await resolveWolfAiSession();
    const requestUrl = buildWolfitnessApiUrl("/api/wolf-ai/generate");

    if (__DEV__) {
      console.info("[Wolf AI]", "Request start", {
        feature: input.feature,
        forceRefresh: Boolean(input.forceRefresh),
        hasAccessToken: Boolean(session.access_token),
        requestUrl,
      });
    }

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feature: input.feature,
        forceRefresh: input.forceRefresh ?? false,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | Partial<WolfAIGenerateResponse<TData>> & { code?: WolfAIErrorCode; error?: string }
      | null;

    if (__DEV__) {
      console.info("[Wolf AI]", "Response received", {
        backendCode: payload?.code ?? null,
        feature: input.feature,
        message: (payload as { message?: string } | null)?.message ?? payload?.error ?? null,
        responseStatus: response.status,
      });
    }

    if (!response.ok) {
      const code = payload?.code;
      const message = (payload as { message?: string } | null)?.message ?? payload?.error ?? WOLF_AI_ERROR_MESSAGES.unknown;

      if (code === "LIMIT_REACHED" || response.status === 429) {
        throw new WolfAIError(message || WOLF_AI_ERROR_MESSAGES.limitReached, "LIMIT_REACHED");
      }

      if (code === "UNAUTHORIZED") {
        throw new WolfAIError(message || WOLF_AI_ERROR_MESSAGES.authentication, "UNAUTHORIZED");
      }

      if (code === "GUARDRAIL") {
        throw new WolfAIError(message || "Wolf AI returned a safety response.", "GUARDRAIL");
      }

      throw new WolfAIError(message, "INTERNAL_ERROR");
    }

    if (
      !payload ||
      typeof payload.cached !== "boolean" ||
      typeof payload.data !== "object" ||
      payload.data === null ||
      typeof payload.feature !== "string" ||
      typeof payload.generatedForDate !== "string" ||
      typeof payload.safetyCategory !== "string" ||
      typeof payload.usedFallback !== "boolean" ||
      typeof payload.usage !== "object" ||
      payload.usage === null
    ) {
      throw new WolfAIError("Wolf AI response was malformed.", "INTERNAL_ERROR");
    }

    const usage = parseUsage(payload.usage);
    if (!usage) {
      throw new WolfAIError("Wolf AI usage payload was malformed.", "INTERNAL_ERROR");
    }

    return {
      code: payload.code === "LIMIT_REACHED" ? "LIMIT_REACHED" : "OK",
      cached: payload.cached,
      data: payload.data as TData,
      feature: payload.feature as WolfAIFeature,
      generatedForDate: payload.generatedForDate,
      safetyCategory: payload.safetyCategory,
      usedFallback: payload.usedFallback,
      usage: {
        isLimitReached: payload.usage.isLimitReached ?? usage.remaining <= 0,
        limit: usage.limit,
        remaining: usage.remaining,
        tier: usage.tier,
        used: usage.used,
      },
    };
  } catch (error) {
    throw normalizeWolfAIError(error);
  }
}
