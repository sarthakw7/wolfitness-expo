import { supabase } from "@/src/lib/supabase";

import { WOLF_AI_ERROR_MESSAGES } from "../constants";
import { WolfAIError } from "../types";
import type { WolfAIFeature, WolfAIGenerateResponse, WolfAIErrorCode, WolfAIUsageResponse } from "../types";

function getWolfAiApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
}

function resolveWolfAiApiUrl(path: string) {
  const baseUrl = getWolfAiApiBaseUrl();
  if (!baseUrl) {
    throw new WolfAIError(
      "Wolf AI API URL is not configured. Set EXPO_PUBLIC_API_URL for AI requests.",
      "INTERNAL_ERROR",
    );
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

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
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) {
      throw new WolfAIError(WOLF_AI_ERROR_MESSAGES.authentication, "UNAUTHORIZED");
    }

    const response = await fetch(resolveWolfAiApiUrl("/api/wolf-ai/generate"), {
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

    if (!response.ok) {
      const code = payload?.code ?? (response.status === 429 ? "LIMIT_REACHED" : "INTERNAL_ERROR");
      if (code === "LIMIT_REACHED") {
        throw new WolfAIError(payload?.error || WOLF_AI_ERROR_MESSAGES.limitReached, code);
      }

      if (code === "UNAUTHORIZED") {
        throw new WolfAIError(payload?.error || WOLF_AI_ERROR_MESSAGES.authentication, code);
      }

      if (code === "GUARDRAIL") {
        throw new WolfAIError(payload?.error || "Wolf AI returned a safety response.", code);
      }

      throw new WolfAIError(payload?.error || WOLF_AI_ERROR_MESSAGES.unknown, code);
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
      cached: payload.cached,
      data: payload.data as TData,
      feature: payload.feature as WolfAIFeature,
      generatedForDate: payload.generatedForDate,
      safetyCategory: payload.safetyCategory,
      usedFallback: payload.usedFallback,
      usage: {
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
