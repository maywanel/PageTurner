"use client";
let tokenPromise: Promise<{ token: string; headerName: string }> | undefined;
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export function clearSession() {
  tokenPromise = undefined;
}
async function csrf() {
  tokenPromise ??= fetch("/api/csrf", {
    cache: "no-store",
    credentials: "same-origin",
  })
    .then(async (response) => {
      if (!response.ok)
        throw new Error("Unable to verify your session. Please try again.");
      return response.json();
    })
    .catch((error) => {
      tokenPromise = undefined;
      throw error;
    });
  return tokenPromise;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  const mutation = !["GET", "HEAD", "OPTIONS"].includes(init.method || "GET");
  if (mutation) {
    const token = await csrf();
    headers.set(token.headerName, token.token);
  }
  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    if (response.status === 403 && mutation) {
      clearSession();
      // CSRF rejects an expired mutation before the session interceptor runs.
      try {
        const session = await fetch("/users/me", { cache: "no-store" });
        if (
          session.status === 401 &&
          !["/login", "/register"].includes(location.pathname)
        ) {
          location.assign("/login?expired=1");
        }
      } catch {
        /* Preserve the original error if the network is unavailable. */
      }
    }
    if (response.headers.get("X-Session-Expired") === "true") {
      clearSession();
      if (!["/login", "/register"].includes(location.pathname))
        location.assign("/login?expired=1");
    }
    throw new ApiError(
      typeof data === "string"
        ? data
        : data?.message ||
            data?.error ||
            "Something went wrong. Please try again.",
      response.status,
    );
  }
  return data as T;
}
