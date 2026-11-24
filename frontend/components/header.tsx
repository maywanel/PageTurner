"use client";
import { useState } from "react";
import { Books, ArrowUpRight, SignOut, GearSix } from "@phosphor-icons/react";
import type { User } from "@/lib/types";
import { api, clearSession } from "@/lib/api";
export function Header({
  user,
  section = "Library",
}: {
  user?: User | null;
  section?: string;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    try {
      await api("/users/logout", { method: "POST" });
      clearSession();
      location.assign("/login");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <header className="site-header">
        <a
          className="wordmark"
          href={user ? "/home" : "/login"}
          aria-label="PageTurner home"
        >
          <Books size={23} weight="duotone" />
          <span>PageTurner</span>
          <i />
        </a>
        <span className="header-divider" />
        <span className="breadcrumb">{section}</span>
        <nav
          aria-label="Main navigation"
          className="ml-auto flex items-center gap-2 sm:gap-4"
        >
          {user ? (
            <>
              <a
                className="icon-button"
                href="/settings"
                aria-label="Account settings"
              >
                <GearSix size={19} />
              </a>
              <button
                className="header-signout"
                onClick={logout}
                disabled={busy}
                aria-label="Sign out"
              >
                <span>Sign out</span>
                <SignOut size={17} />
              </button>
            </>
          ) : (
            <a
              className="header-link"
              href={section === "Welcome" ? "/register" : "/login"}
            >
              {section === "Welcome" ? "Create account" : "Sign in"}{" "}
              <ArrowUpRight size={14} />
            </a>
          )}
        </nav>
      </header>
      {error && (
        <p role="alert" className="notice error mx-6">
          {error}
        </p>
      )}
    </>
  );
}
