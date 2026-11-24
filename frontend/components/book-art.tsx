"use client";
import { useState, type CSSProperties } from "react";
import type { Book } from "@/lib/types";
import { bookHash, topics } from "@/lib/books";
export function Spine({
  book,
  index = 0,
  color,
  onClick,
}: {
  book: Book;
  index?: number;
  color?: string;
  onClick?: () => void;
}) {
  const hash = bookHash(book);
  const style = {
    "--binding": color || topics[Math.floor(index / 8) % topics.length].color,
    "--book-height": `${178 + (hash % 66)}px`,
    "--book-width": `${37 + (hash % 19)}px`,
    "--tint": `${(hash % 5) * 3}%`,
  } as CSSProperties;
  const content = (
    <>
      <span className="spine-bands" />
      <span className={`spine-label ${hash % 3 === 0 ? "paper-label" : ""}`}>
        {book.title}
      </span>
      <span className="spine-author">{book.author.split(" ").at(-1)}</span>
      <span className="spine-ornament">✦</span>
    </>
  );
  if (!onClick)
    return (
      <div className="book-spine" style={style} aria-hidden="true">
        {content}
      </div>
    );
  return (
    <button
      className="book-spine"
      style={style}
      onClick={onClick}
      aria-label={`Open ${book.title}`}
    >
      <span className="spine-tooltip">
        <strong>{book.title}</strong>
        <span>{book.author}</span>
      </span>
      {content}
    </button>
  );
}
export function BookCover({
  book,
  color,
  className = "",
}: {
  book: Book;
  color?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const hash = bookHash(book);
  const image = book.coverId
    ? `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg?default=false`
    : book.isbn && book.isbn !== "N/A"
      ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-M.jpg?default=false`
      : "";
  return (
    <div
      className={`book-cover ${className}`}
      style={
        {
          "--binding": color || topics[hash % topics.length].color,
        } as CSSProperties
      }
    >
      <div className="cover-inset">
        <span className="cover-imprint">THE PAGETURNER LIBRARY</span>
        <span className="cover-flower" aria-hidden="true">
          ❦
        </span>
        <strong>{book.title}</strong>
        <span className="cover-author">{book.author}</span>
      </div>
      {image && !failed && (
        <img
          src={image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            if (e.currentTarget.naturalWidth < 10) setFailed(true);
          }}
        />
      )}
      <span className="cover-binding" />
    </div>
  );
}
