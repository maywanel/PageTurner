"use client";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, LockKey } from "@phosphor-icons/react";
import { Header } from "./header";
import type { User } from "@/lib/types";
import { isAdmin } from "@/lib/types";
import { api } from "@/lib/api";
export function Account() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<User>("/users/me")
      .then(setUser)
      .catch((e) => setError(e.message));
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setError("");
    setNotice("");
    if (data.get("newPassword") !== data.get("confirm")) {
      setError("Your new passwords don’t match.");
      return;
    }
    setBusy(true);
    try {
      await api(`/users/${user!.id}/password`, {
        method: "PUT",
        body: JSON.stringify({
          oldPassword: data.get("oldPassword"),
          newPassword: data.get("newPassword"),
        }),
      });
      setNotice("Your password has been updated.");
      form.reset();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header user={user} section="Your account" />
      <main id="main-content" className="inner-main">
        <a href="/home" className="back-link">
          <ArrowLeft size={14} />
          Back to the library
        </a>
        <h1>Your little corner.</h1>
        <p className="page-intro">The person behind the bookshelf.</p>
        <div className="account-grid">
          <section>
            <h2>Your details</h2>
            {user ? (
              <dl className="details-list">
                <div>
                  <dt>Name</dt>
                  <dd>{user.name}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{user.email}</dd>
                </div>
                <div>
                  <dt>Membership</dt>
                  <dd>{isAdmin(user) ? "Administrator" : "Reader"}</dd>
                </div>
              </dl>
            ) : (
              <p role="status">Loading your account…</p>
            )}
            {isAdmin(user) && (
              <a className="text-button mt-5" href="/admin">
                Manage the library <ArrowRight size={16} />
              </a>
            )}
          </section>
          <section>
            <h2>A fresh password</h2>
            <p className="text-muted text-sm mb-6">
              Keep your personal library yours.
            </p>
            <form className="space-y-5" onSubmit={submit}>
              <label className="field-label">
                Current password
                <input
                  name="oldPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </label>
              <label className="field-label">
                New password
                <input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  required
                />
              </label>
              <label className="field-label">
                Confirm new password
                <input
                  name="confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  maxLength={72}
                  required
                />
              </label>
              {error && (
                <p role="alert" className="notice error">
                  {error}
                </p>
              )}
              {notice && (
                <p role="status" className="notice success">
                  {notice}
                </p>
              )}
              <button className="primary-button" disabled={!user || busy}>
                <LockKey size={16} />
                {busy ? "Updating…" : "Update password"}
                <ArrowRight size={16} />
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}
