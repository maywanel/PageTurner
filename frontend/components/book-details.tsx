"use client";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookmarkSimple,
  Check,
  Trash,
  BookOpen,
} from "@phosphor-icons/react";
import type { Book, ReadingOption, ReadingStatus } from "@/lib/types";
import { statuses } from "@/lib/types";
import { readingUrl } from "@/lib/books";
import { api } from "@/lib/api";
import { Dialog } from "./dialog";
import { BookCover } from "./book-art";
export function BookDetails({
  book,
  saved,
  onClose,
  onSave,
  onRemove,
  onStatus,
}: {
  book: Book;
  saved?: Book;
  onClose: () => void;
  onSave: (book: Book) => Promise<void>;
  onRemove: (book: Book) => Promise<void>;
  onStatus: (book: Book, status: ReadingStatus) => Promise<void>;
}) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState<ReadingOption[]>([]);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState("");
  const [checked, setChecked] = useState(false);
  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function checkReading() {
    const isbn = (book.isbn || "").replace(/[\s-]/g, "");
    setReadError("");
    setChecked(true);
    if (!/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) return;
    setReading(true);
    try {
      const result = await api<{ options: ReadingOption[] }>(
        `/books/reading?isbn=${encodeURIComponent(isbn)}`,
      );
      setOptions(result.options.filter((option) => readingUrl(option.url)));
    } catch (e) {
      setReadError((e as Error).message);
    } finally {
      setReading(false);
    }
  }
  useEffect(() => {
    setOptions([]);
    setChecked(false);
  }, [book]);
  const fallback = `https://openlibrary.org/search?title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`;
  return (
    <Dialog onClose={onClose} label={book.title} className="open-book-dialog">
      <div className="open-book">
        <div className="book-left-page">
          <BookCover book={book} />
          <span className="ex-libris">Ex libris · PageTurner</span>
        </div>
        <div className="book-right-page">
          <h2>{book.title}</h2>
          <p className="detail-author">{book.author}</p>
          <p className="mt-3 text-xs text-muted">
            {saved
              ? "From your personal library"
              : "Discovered on Open Library"}
          </p>
          {book.description && (
            <p className="book-description">{book.description}</p>
          )}
          {book.isbn && book.isbn !== "N/A" && (
            <p className="text-xs text-muted mt-4">ISBN {book.isbn}</p>
          )}
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <div className="detail-actions">
            {saved ? (
              <>
                <label className="field-label">
                  On your shelf
                  <select
                    aria-label="Reading status"
                    disabled={busy}
                    value={saved.readingStatus || "WANT_TO_READ"}
                    onChange={(e) =>
                      act(() =>
                        onStatus(saved, e.target.value as ReadingStatus),
                      )
                    }
                  >
                    {Object.entries(statuses).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex gap-2 items-center text-green-800">
                    <Check size={16} />
                    In your library
                  </span>
                  {confirmRemove ? (
                    <div
                      className="remove-options"
                      role="group"
                      aria-label="Confirm removal"
                    >
                      <button
                        className="text-button"
                        disabled={busy}
                        onClick={() => setConfirmRemove(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="text-button danger"
                        disabled={busy}
                        onClick={() =>
                          act(async () => {
                            await onRemove(saved);
                            setConfirmRemove(false);
                          })
                        }
                      >
                        Remove from shelf
                      </button>
                    </div>
                  ) : (
                    <button
                      className="text-button danger"
                      disabled={busy}
                      onClick={() => setConfirmRemove(true)}
                    >
                      <Trash size={14} /> Remove
                    </button>
                  )}
                </div>
              </>
            ) : (
              <button
                className="primary-button w-full"
                disabled={busy}
                onClick={() => act(() => onSave(book))}
              >
                <BookmarkSimple size={17} />
                {busy ? "Saving…" : "Add to your library"}
              </button>
            )}
            <button
              className="secondary-button w-full"
              disabled={reading}
              onClick={checkReading}
            >
              {reading
                ? "Finding reading options…"
                : checked
                  ? "Check reading options again"
                  : "Find a readable edition"}
              <ArrowUpRight size={16} />
            </button>
            {readError && (
              <p className="notice error" role="alert">
                {readError}
              </p>
            )}
            {checked && !reading && (
              <div className="reading-options">
                {options.length ? (
                  options.map((option, i) => (
                    <div key={i}>
                      <a
                        href={readingUrl(option.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {option.label}
                        <ArrowUpRight size={14} />
                      </a>
                      {option.differentEdition && (
                        <small>A different edition of this work.</small>
                      )}
                    </div>
                  ))
                ) : (
                  <a href={fallback} target="_blank" rel="noopener noreferrer">
                    Find editions on Open Library
                    <ArrowUpRight size={14} />
                  </a>
                )}
                <p>
                  Reading opens in a new tab. Borrowing may require an Open
                  Library account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
