function normalizeApiUrl(rawValue: string, envName: string, serviceName: string) {
  const value = rawValue.trim();

  if (!value) {
    throw new Error(`[API Config] Missing ${envName}. Set it to your Mac LAN URL for ${serviceName}.`);
  }

  if (value.includes("localhost") || value.includes("127.0.0.1")) {
    throw new Error(`[API Config] ${envName} must use your Mac LAN IP for ${serviceName}, not localhost.`);
  }

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error();
    }

    return parsed.origin.replace(/\/$/, "");
  } catch {
    throw new Error(`[API Config] ${envName} is invalid. Expected an http(s) URL for ${serviceName}.`);
  }
}

function readRequiredApiUrl(envName: "EXPO_PUBLIC_SIGNAL_API_URL" | "EXPO_PUBLIC_WOLFITNESS_API_URL", serviceName: string) {
  return normalizeApiUrl(process.env[envName] ?? "", envName, serviceName);
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export const SIGNAL_API_URL = readRequiredApiUrl("EXPO_PUBLIC_SIGNAL_API_URL", "Signal");
export const WOLFITNESS_API_URL = readRequiredApiUrl("EXPO_PUBLIC_WOLFITNESS_API_URL", "Wolfitness");

export function buildSignalApiUrl(path: string) {
  return `${SIGNAL_API_URL}${normalizePath(path)}`;
}

export function buildWolfitnessApiUrl(path: string) {
  return `${WOLFITNESS_API_URL}${normalizePath(path)}`;
}

if (__DEV__) {
  console.info("[API Config] Signal:", SIGNAL_API_URL);
  console.info("[API Config] Wolfitness:", WOLFITNESS_API_URL);
}
