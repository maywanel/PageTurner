"use client";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import { Header } from "./header";
import { BookCover } from "./book-art";
import { previewBooks } from "@/lib/books";
import { api, clearSession } from "@/lib/api";
export function Auth({ register = false }: { register?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    setExpired(
      !register && new URLSearchParams(location.search).get("expired") === "1",
    );
  }, [register]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    try {
      if (register)
        await api("/users", {
          method: "POST",
          body: JSON.stringify({
            name: String(data.get("name")).trim(),
            email,
            password,
          }),
        });
      await api("/users/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      clearSession();
      location.assign("/home");
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <>
      <Header section={register ? "Join the library" : "Welcome"} />
      <main id="main-content" className="auth-main">
        <section className="auth-form-area">
          <div className="auth-form-inner">
            <h1>{register ? "Create your library" : "Welcome back."}</h1>
            <p className="text-muted mb-8">
              {register
                ? "Create an account to start your first shelf."
                : "Sign in to your personal library."}
            </p>
            {expired && (
              <p className="session-notice" role="status">
                Your session ended. Sign in to continue.
              </p>
            )}
            <form onSubmit={submit} className="space-y-5">
              {register && (
                <label className="field-label">
                  Your name
                  <input
                    autoComplete="name"
                    name="name"
                    placeholder="Your name"
                    maxLength={100}
                    required
                  />
                </label>
              )}
              <label className="field-label">
                Email address
                <input
                  type="email"
                  autoComplete="email"
                  name="email"
                  placeholder="you@example.com"
                  maxLength={255}
                  required
                />
              </label>
              <label className="field-label">
                Password
                <div className="password-field">
                  <input
                    type={show ? "text" : "password"}
                    autoComplete={
                      register ? "new-password" : "current-password"
                    }
                    name="password"
                    placeholder={
                      register ? "At least 6 characters" : "Your password"
                    }
                    minLength={register ? 6 : undefined}
                    maxLength={72}
                    required
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
              {error && (
                <p className="notice error" role="alert">
                  {error}
                </p>
              )}
              <button className="btn primary-button w-full" disabled={busy}>
                {busy
                  ? "Signing in…"
                  : register
                    ? "Create your library"
                    : "Sign in"}
                <ArrowRight size={17} />
              </button>
            </form>
            <p className="auth-switch">
              {register ? "Already have a library?" : "New around here?"}{" "}
              <a href={register ? "/login" : "/register"}>
                {register ? "Sign in" : "Create an account"}
              </a>
            </p>
          </div>
        </section>
        <section className="auth-story">
          <div className="auth-story-text">
            <h2>
              A home for
              <br />
              <em>your books.</em>
            </h2>
            <p>Collect your favorites and keep track of what you’re reading.</p>
          </div>
          <div className="jacket-display" aria-hidden="true">
            <BookCover book={previewBooks[0]} color="#884d43" />
            <BookCover book={previewBooks[1]} color="#5b6953" />
            <BookCover book={previewBooks[5]} color="#425c70" />
          </div>
        </section>
      </main>
    </>
  );
}
