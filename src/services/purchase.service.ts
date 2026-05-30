import { assertSupabaseConfigured, supabase } from "@/src/lib/supabase";

export type InitPurchaseResponse = {
  checkoutUrl: string;
  isFree: boolean;
  purchaseId: string | null;
};

type PurchaseErrorCode =
  | "BAD_REQUEST"
  | "CONFIGURATION_ERROR"
  | "INTERNAL_ERROR"
  | "PARSE_ERROR"
  | "UNAUTHORIZED";

export class PurchaseError extends Error {
  code: PurchaseErrorCode;

  constructor(message: string, code: PurchaseErrorCode = "INTERNAL_ERROR") {
    super(message);
    this.code = code;
    this.name = "PurchaseError";
  }
}

function logPurchase(level: "error" | "warn" | "info", message: string, context?: Record<string, unknown>) {
  console[level]("[purchase]", message, context ?? {});
}

function getExpoApiBaseUrl() {
  return process.env.EXPO_PUBLIC_API_URL?.trim() ?? "";
}

function resolvePurchaseApiUrl(path: string) {
  const baseUrl = getExpoApiBaseUrl();
  if (!baseUrl) {
    throw new PurchaseError(
      "Purchase API URL is not configured. Set EXPO_PUBLIC_API_URL for marketplace purchases.",
      "CONFIGURATION_ERROR",
    );
  }

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function normalizePurchaseError(error: unknown, fallbackMessage: string): PurchaseError {
  if (error instanceof PurchaseError) return error;
  if (error instanceof Error) return new PurchaseError(error.message || fallbackMessage);
  return new PurchaseError(fallbackMessage);
}

export async function initPurchase(input: { cancelUrl?: string; programId: string; successUrl?: string }): Promise<InitPurchaseResponse> {
  try {
    assertSupabaseConfigured();

    if (!input.programId.trim()) {
      throw new PurchaseError("Program ID is required.", "BAD_REQUEST");
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) throw sessionError;
    if (!session?.access_token) {
      throw new PurchaseError("You must be signed in to purchase a program.", "UNAUTHORIZED");
    }

    logPurchase("info", "Purchase init request started.", { programId: input.programId });

    const response = await fetch(resolvePurchaseApiUrl("/api/purchase/init"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cancelUrl: input.cancelUrl,
        programId: input.programId,
        successUrl: input.successUrl,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          checkoutUrl?: unknown;
          error?: string;
          isFree?: unknown;
          message?: string;
          purchaseId?: unknown;
        }
      | null;

    if (!response.ok) {
      throw new PurchaseError(payload?.message || payload?.error || "Unable to initialize purchase.");
    }

    if (!payload || typeof payload.checkoutUrl !== "string") {
      throw new PurchaseError("Purchase init response was malformed.", "PARSE_ERROR");
    }

    const purchaseId = typeof payload.purchaseId === "string" ? payload.purchaseId : null;
    const isFree = typeof payload.isFree === "boolean" ? payload.isFree : purchaseId === null;

    logPurchase("info", "Purchase init request completed.", {
      isFree,
      programId: input.programId,
      purchaseId,
    });

    return {
      checkoutUrl: payload.checkoutUrl,
      isFree,
      purchaseId,
    };
  } catch (error) {
    logPurchase("warn", "Purchase init request failed.", {
      message: error instanceof Error ? error.message : String(error),
      programId: input.programId,
    });
    throw normalizePurchaseError(error, "Unable to initialize purchase.");
  }
}
