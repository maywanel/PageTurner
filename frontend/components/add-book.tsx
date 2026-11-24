"use client";
import { useState, type FormEvent } from "react";
import type { Book } from "@/lib/types";
import { Dialog } from "./dialog";
export function AddBook({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (book: Book) => Promise<void>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await onSave({
        title: String(data.get("title")).trim(),
        author: String(data.get("author")).trim(),
        isbn: String(data.get("isbn")).trim() || "N/A",
        description: String(data.get("description")).trim(),
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog onClose={onClose} label="Add a book" className="form-dialog">
      <h2>A new addition.</h2>
      <p className="text-muted mb-6">Make a little room on your shelf.</p>
      <form onSubmit={submit} className="space-y-4">
        <label className="field-label">
          Title
          <input name="title" maxLength={255} required autoFocus />
        </label>
        <label className="field-label">
          Author
          <input name="author" maxLength={255} required />
        </label>
        <label className="field-label">
          ISBN <span className="text-muted">(optional)</span>
          <input name="isbn" maxLength={255} />
        </label>
        <label className="field-label">
          About the book <span className="text-muted">(optional)</span>
          <textarea name="description" rows={3} maxLength={2000} />
        </label>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <button className="primary-button w-full" disabled={busy}>
          {busy ? "Adding…" : "Add to library"}
        </button>
      </form>
    </Dialog>
  );
}
