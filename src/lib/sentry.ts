import * as Sentry from "@sentry/react-native";
import type { ErrorEvent } from "@sentry/react-native";
import Constants from "expo-constants";

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN?.trim() ?? "";
const explicitEnvironment = process.env.EXPO_PUBLIC_APP_ENV?.trim() ?? "";
const shouldEnableInDevelopment = process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV === "true";
const shouldDebugInDevelopment = process.env.EXPO_PUBLIC_SENTRY_DEBUG === "true";

let didInitialize = false;

function resolveEnvironment() {
  if (explicitEnvironment) return explicitEnvironment;
  return __DEV__ ? "development" : "production";
}

function resolveRelease() {
  const slug = Constants.expoConfig?.slug?.trim();
  const version = Constants.expoConfig?.version?.trim();

  if (slug && version) return `${slug}@${version}`;
  if (version) return version;
  return undefined;
}

function sanitizeEvent(event: ErrorEvent): ErrorEvent | null {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  if (event.request?.headers) {
    const headers = { ...event.request.headers };
    delete headers.Authorization;
    delete headers.authorization;
    delete headers.Cookie;
    delete headers.cookie;

    event.request = {
      ...event.request,
      headers,
    };
  }

  return event;
}

export function isSentryConfigured() {
  return Boolean(dsn);
}

export function initSentry() {
  if (didInitialize) return;
  didInitialize = true;

  if (!dsn) {
    if (!__DEV__) {
      console.warn("[sentry]", "Sentry DSN is not configured. Crash reporting is disabled.");
    }
    return;
  }

  Sentry.init({
    attachStacktrace: true,
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "console" && __DEV__) {
        return null;
      }

      return breadcrumb;
    },
    beforeSend: sanitizeEvent,
    debug: __DEV__ && shouldDebugInDevelopment,
    dsn,
    enabled: !__DEV__ || shouldEnableInDevelopment,
    environment: resolveEnvironment(),
    release: resolveRelease(),
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (projectId) {
    Sentry.setTag("eas_project_id", projectId);
  }
}
