"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  PencilSimple,
  Trash,
  ShieldCheck,
  ArrowClockwise,
} from "@phosphor-icons/react";
import { Header } from "./header";
import { Dialog } from "./dialog";
import { api } from "@/lib/api";
import { isAdmin, type User } from "@/lib/types";
export function Admin({
  page = "overview",
}: {
  page?: "overview" | "users" | "system";
}) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [system, setSystem] = useState<Record<string, string | number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Partial<User> | null>(null);
  const [confirm, setConfirm] = useState<{
    user: User;
    action: "delete" | "role";
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    (async () => {
      const current = await api<User>("/users/me");
      if (!isAdmin(current)) {
        location.assign("/error/403");
        return;
      }
      if (!alive) return;
      setUser(current);
      const result = await api<User[] | Record<string, string | number>>(
        page === "system" ? "/api/system/info" : "/users",
      );
      if (alive) {
        if (page === "system")
          setSystem(result as Record<string, string | number>);
        else setUsers(result as User[]);
      }
    })()
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, refresh]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(editing?.id ? `/users/${editing.id}` : "/users", {
        method: editing?.id ? "PUT" : "POST",
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      setEditing(null);
      setNotice("Member details saved.");
      setRefresh((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function confirmAction() {
    if (!confirm) return;
    setBusy(true);
    setError("");
    try {
      await api(
        `/users/${confirm.user.id}${confirm.action === "role" ? "/admin" : ""}`,
        {
          method: confirm.action === "role" ? "PATCH" : "DELETE",
          ...(confirm.action === "role"
            ? { body: JSON.stringify({ isAdmin: !isAdmin(confirm.user) }) }
            : {}),
        },
      );
      setConfirm(null);
      setNotice("Member updated.");
      setRefresh((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = users.filter((u) =>
    `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Header user={user} section="Administration" />
      <main id="main-content" className="inner-main">
        <a href="/home" className="back-link">
          <ArrowLeft size={14} />
          Back to the library
        </a>
        <div className="flex justify-between gap-4 items-end">
          <div>
            <h1>
              {page === "users"
                ? "The readers."
                : page === "system"
                  ? "Behind the pages."
                  : "A well-kept library."}
            </h1>
            <p className="page-intro">
              {page === "users"
                ? "A little care for your reading community."
                : page === "system"
                  ? "A live look at the application."
                  : "Your community, thoughtfully managed."}
            </p>
          </div>
          {page === "users" && (
            <button
              className="secondary-button"
              onClick={() => {
                setError("");
                setEditing({});
              }}
            >
              <Plus size={16} />
              Add member
            </button>
          )}
        </div>
        <nav className="admin-nav" aria-label="Administration">
          <a
            aria-current={page === "overview" ? "page" : undefined}
            href="/admin"
          >
            Overview
          </a>
          <a
            aria-current={page === "users" ? "page" : undefined}
            href="/admin/users"
          >
            Members
          </a>
          <a
            aria-current={page === "system" ? "page" : undefined}
            href="/systeminfo"
          >
            System
          </a>
        </nav>
        {error && !editing && !confirm && (
          <div role="alert" className="notice error">
            {error}{" "}
            <button onClick={() => setRefresh((n) => n + 1)}>Try again</button>
          </div>
        )}
        {notice && (
          <p role="status" className="notice success">
            {notice}
          </p>
        )}
        {loading ? (
          <p role="status" className="py-12 text-muted">
            Opening the records…
          </p>
        ) : page === "overview" ? (
          <div className="admin-overview">
            <section>
              <span className="overview-number">{users.length}</span>
              <h2>Readers in the library</h2>
              <p>
                {users.filter(isAdmin).length} administrators help keep things
                in order.
              </p>
              <a className="text-button" href="/admin/users">
                Manage members
                <ArrowRight size={16} />
              </a>
            </section>
            <section>
              <h2>A little housekeeping.</h2>
              <p>
                Manage accounts, review permissions, and keep an eye on your
                library’s health.
              </p>
              <a className="text-button" href="/systeminfo">
                View system information
                <ArrowRight size={16} />
              </a>
            </section>
          </div>
        ) : page === "users" ? (
          <>
            <label className="field-label max-w-sm my-6">
              Find a member
              <input
                placeholder="Search name or email"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <strong>{member.name}</strong>
                        {member.id === user?.id && <small> · You</small>}
                      </td>
                      <td>{member.email}</td>
                      <td>{isAdmin(member) ? "Administrator" : "Reader"}</td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="icon-button"
                            aria-label={`Edit ${member.name}`}
                            onClick={() => {
                              setError("");
                              setEditing(member);
                            }}
                          >
                            <PencilSimple size={17} />
                          </button>
                          <button
                            className="icon-button"
                            disabled={member.id === user?.id}
                            aria-label={`Change role for ${member.name}`}
                            onClick={() => {
                              setError("");
                              setConfirm({ user: member, action: "role" });
                            }}
                          >
                            <ShieldCheck size={17} />
                          </button>
                          <button
                            className="icon-button danger"
                            disabled={member.id === user?.id}
                            aria-label={`Delete ${member.name}`}
                            onClick={() => {
                              setError("");
                              setConfirm({ user: member, action: "delete" });
                            }}
                          >
                            <Trash size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length && (
                <p className="py-10 text-center text-muted">
                  No readers match your search.
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mt-6">
              <h2>System information</h2>
              <button
                className="text-button"
                onClick={() => setRefresh((n) => n + 1)}
              >
                <ArrowClockwise size={16} />
                Refresh
              </button>
            </div>
            <dl className="system-grid">
              {Object.entries(system)
                .filter(
                  ([key]) =>
                    ![
                      "javaClassPath",
                      "javaLibraryPath",
                      "userHome",
                      "workingDirectory",
                      "userName",
                    ].includes(key),
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (c) => c.toUpperCase())}
                    </dt>
                    <dd>
                      {/memory/i.test(key)
                        ? `${(Number(value) / 1024 / 1024).toFixed(1)} MB`
                        : key === "uptime"
                          ? `${Math.floor(Number(value) / 60000)} minutes`
                          : ["timestamp", "startTime"].includes(key)
                            ? new Date(Number(value)).toLocaleString()
                            : String(value)}
                    </dd>
                  </div>
                ))}
            </dl>
          </>
        )}
      </main>
      {editing && (
        <Dialog
          onClose={() => {
            if (!busy) {
              setEditing(null);
              setError("");
            }
          }}
          label={editing.id ? "Edit member" : "Add member"}
          className="form-dialog"
        >
          <h2>
            {editing.id ? "A reader’s details." : "Welcome a new reader."}
          </h2>
          <form className="space-y-4 mt-6" onSubmit={submit}>
            <label className="field-label">
              Name
              <input
                name="name"
                defaultValue={editing.name}
                required
                maxLength={100}
              />
            </label>
            <label className="field-label">
              Email
              <input
                type="email"
                name="email"
                defaultValue={editing.email}
                required
                maxLength={255}
              />
            </label>
            <label className="field-label">
              {editing.id ? "New password (leave blank to keep)" : "Password"}
              <input
                name="password"
                type="password"
                required={!editing.id}
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
              />
            </label>
            {error && (
              <p className="notice error" role="alert">
                {error}
              </p>
            )}
            <button className="primary-button w-full" disabled={busy}>
              {busy ? "Saving…" : "Save member"}
            </button>
          </form>
        </Dialog>
      )}
      {confirm && (
        <Dialog
          onClose={() => {
            if (!busy) {
              setConfirm(null);
              setError("");
            }
          }}
          label="Confirm member change"
          className="form-dialog"
        >
          <h2>
            {confirm.action === "delete"
              ? "Remove this reader?"
              : "Change their role?"}
          </h2>
          <p className="my-6">
            {confirm.action === "delete"
              ? `This will delete ${confirm.user.name}’s account. This cannot be undone.`
              : `${confirm.user.name} will become ${isAdmin(confirm.user) ? "a reader" : "an administrator"}.`}
          </p>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button
              className="secondary-button"
              disabled={busy}
              onClick={() => setConfirm(null)}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              disabled={busy}
              onClick={confirmAction}
            >
              {busy ? "Updating…" : "Confirm"}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
