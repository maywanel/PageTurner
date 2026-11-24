"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Books,
  SquaresFour,
  MagnifyingGlass,
  Plus,
  ArrowRight,
  ArrowLeft,
  ArrowClockwise,
  BookOpen,
  CheckCircle,
  BookmarkSimple,
  Compass,
  X,
  Rows,
} from "@phosphor-icons/react";
import { Header } from "./header";
import { Spine, BookCover } from "./book-art";
import { BookDetails } from "./book-details";
import { AddBook } from "./add-book";
import { api } from "@/lib/api";
import { bookHash, titleKey, topics, selectBooks } from "@/lib/books";
import type { Book, User, ReadingStatus } from "@/lib/types";
import { statuses } from "@/lib/types";
export function Library() {
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<Book[]>([]);
  const [catalog, setCatalog] = useState<Book[]>([]);
  const [mode, setMode] = useState<"discover" | "library">("discover");
  const [view, setView] = useState<"shelf" | "covers" | "topics">("shelf");
  const [topic, setTopic] = useState("fiction");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("default");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessionRetry, setSessionRetry] = useState(0);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<Book | null>(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  const collectionRef = useRef<HTMLElement>(null);
  const [collectionWidth, setCollectionWidth] = useState(1000);
  const [shelfPage, setShelfPage] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    api<User>("/users/me", { signal: controller.signal })
      .then(setUser)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [sessionRetry]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      api<Book[]>("/books", { signal: controller.signal }),
      mode === "discover"
        ? api<Book[]>(
            `/books/search?query=${encodeURIComponent(search || `subject:${topic}`)}&page=${page}`,
            { signal: controller.signal },
          )
        : Promise.resolve([]),
    ])
      .then(([collection, results]) => {
        setSaved(collection);
        setCatalog(results);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [user, mode, topic, search, page, retry]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement).tagName,
        )
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (event: PageTransitionEvent) => {
      if (event.persisted) setRetry((n) => n + 1);
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, []);
  const visible = useMemo(
    () =>
      selectBooks(mode === "library" ? saved : catalog, {
        query,
        status,
        sort,
        personal: mode === "library",
      }),
    [mode, saved, catalog, query, status, sort],
  );
  useEffect(() => {
    const element = collectionRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setCollectionWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setShelfPage(0);
  }, [mode, view, topic, query, search, sort, status, page]);
  // Budget for the widest binding, gaps, shelf padding, and bookend.
  const pageSize =
    view === "covers"
      ? Math.max(1, Math.min(5, Math.floor(collectionWidth / 150)))
      : Math.max(1, Math.floor((collectionWidth - 60) / 58));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentShelfPage = Math.min(shelfPage, pageCount - 1);
  const pageBooks = visible.slice(
    currentShelfPage * pageSize,
    (currentShelfPage + 1) * pageSize,
  );
  const groups = pageBooks.length ? [pageBooks] : [];
  async function save(book: Book) {
    const result = await api<Book>("/books", {
      method: "POST",
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        description: book.description || "",
        isbn: book.isbn || "N/A",
        coverId: book.coverId || null,
      }),
    });
    setSaved((previous) => [result, ...previous]);
    setNotice("Book added to your library.");
  }
  async function remove(book: Book) {
    await api(`/books/${book.id}`, { method: "DELETE" });
    setSaved((previous) => previous.filter((item) => item.id !== book.id));
    setNotice("Book removed from your library.");
  }
  async function changeStatus(book: Book, value: ReadingStatus) {
    const result = await api<Book>(`/books/${book.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ readingStatus: value }),
    });
    setSaved((previous) =>
      previous.map((item) => (item.id === book.id ? result : item)),
    );
    setNotice(`Moved to ${statuses[value].toLowerCase()}.`);
  }
  function switchMode(value: "discover" | "library") {
    setMode(value);
    setQuery("");
    setSearch("");
    setPage(1);
    setStatus("ALL");
    setView("shelf");
  }
  function chooseTopic(value: string) {
    setTopic(value);
    setSearch("");
    setQuery("");
    setPage(1);
    setView("shelf");
  }
  const currentTopic = topics.find((item) => item.query === topic)!;
  return (
    <>
      <Header user={user} />
      <main id="main-content" className="library-main">
        <div className="room-masthead">
          <div
            className="section-nav"
            role="group"
            aria-label="Collection source"
          >
            <button
              aria-pressed={mode === "discover"}
              onClick={() => switchMode("discover")}
            >
              <Compass size={15} />
              Discover
            </button>

            <button
              aria-pressed={mode === "library"}
              onClick={() => switchMode("library")}
            >
              <Books size={15} />
              Your library
            </button>
          </div>
          <div className="library-heading">
            <div>
              <h1>
                {mode === "library"
                  ? "Your library"
                  : search
                    ? "Search results"
                    : "The reading room."}
              </h1>
              <p className="library-subtitle">
                {mode === "library"
                  ? "Your saved books and reading progress."
                  : search
                    ? `Books matching “${search}”`
                    : "Find your next book by title, author, or subject."}
              </p>
            </div>
            <button
              aria-label="Add a book"
              className="btn add-button"
              onClick={() => setAdding(true)}
            >
              <Plus size={16} />
              <span>Add a book</span>
            </button>
          </div>
          {mode === "library" && (
            <div className="library-stats">
              <span>
                <strong>{saved.length}</strong> books on your shelf
              </span>
              <span>
                <strong>
                  {saved.filter((b) => b.readingStatus === "READING").length}
                </strong>{" "}
                in progress
              </span>
              <span>
                <strong>
                  {saved.filter((b) => b.readingStatus === "FINISHED").length}
                </strong>{" "}
                read
              </span>
            </div>
          )}
        </div>
        <div className="library-toolbar">
          <div className="segmented" aria-label="Library view">
            {(
              [
                { id: "shelf", label: "Shelf", Icon: Books },
                { id: "covers", label: "Covers", Icon: Rows },
                ...(mode === "discover"
                  ? [{ id: "topics", label: "Topics", Icon: SquaresFour }]
                  : []),
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                aria-pressed={view === id}
                onClick={() => setView(id as typeof view)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>
          <form
            className="search-field"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(query.trim());
              setPage(1);
              if (view === "topics") setView("shelf");
            }}
          >
            <MagnifyingGlass size={16} />
            <input
              ref={searchRef}
              aria-label={
                mode === "library"
                  ? "Search your library"
                  : "Search books and authors"
              }
              placeholder={
                mode === "library"
                  ? "Search your library"
                  : "Search books, authors…"
              }
              maxLength={200}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery("");
                  setSearch("");
                  setPage(1);
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <kbd className="kbd kbd-xs">/</kbd>
            )}
            {mode === "discover" && query.trim() && (
              <button
                className="search-submit"
                type="submit"
                aria-label="Search"
              >
                <ArrowRight size={17} />
              </button>
            )}
          </form>
          <label className="sort-control">
            <span>Arrange by</span>
            <select
              aria-label="Arrange books"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">
                {mode === "library" ? "Newest" : "Relevance"}
              </option>
              {mode === "library" && <option value="oldest">Oldest</option>}
              <option value="title">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
              {mode === "library" && (
                <option value="status">Reading status</option>
              )}
              <option value="author">Author</option>
              <option value="color">Colour</option>
            </select>
          </label>
        </div>
        <div
          className="topic-filters"
          aria-label={mode === "library" ? "Reading status" : "Book topics"}
        >
          {mode === "library" ? (
            <>
              {[
                { id: "ALL", label: "All books", Icon: Books },
                {
                  id: "WANT_TO_READ",
                  label: "Want to read",
                  Icon: BookmarkSimple,
                },
                { id: "READING", label: "Reading now", Icon: BookOpen },
                { id: "FINISHED", label: "Finished", Icon: CheckCircle },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  className={status === id ? "active" : ""}
                  aria-pressed={status === id}
                  onClick={() => setStatus(id)}
                >
                  <Icon size={14} />
                  {label}
                  <span>
                    {id === "ALL"
                      ? saved.length
                      : saved.filter(
                          (b) => (b.readingStatus || "WANT_TO_READ") === id,
                        ).length}
                  </span>
                </button>
              ))}
            </>
          ) : (
            topics.map((item, i) => (
              <button
                key={item.query}
                aria-pressed={topic === item.query && !search}
                className={topic === item.query && !search ? "active" : ""}
                onClick={() => chooseTopic(item.query)}
              >
                <span
                  className="topic-book"
                  style={{ background: item.color }}
                />
                {item.name}
              </button>
            ))
          )}
        </div>
        <section
          className="collection"
          ref={collectionRef}
          aria-label="Book collection"
          aria-busy={loading}
        >
          {error ? (
            <div className="empty-state" role="alert">
              <BookOpen size={30} />
              <h2>The shelf is taking a moment.</h2>
              <p>{error}</p>
              <button
                className="secondary-button"
                onClick={() =>
                  user ? setRetry((n) => n + 1) : setSessionRetry((n) => n + 1)
                }
              >
                <ArrowClockwise size={16} />
                Try again
              </button>
            </div>
          ) : loading ? (
            <div className="shelf-loading" role="status">
              <div className="loading-books">
                {Array.from({ length: 15 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 145 + ((i * 29) % 75),
                      width: 32 + ((i * 7) % 18),
                    }}
                  />
                ))}
              </div>
              <div className="wooden-shelf" />
              <p>Finding a few good books…</p>
            </div>
          ) : view === "topics" ? (
            <div className="topics-grid">
              {topics.map((item, i) => (
                <button
                  key={item.query}
                  className="topic-card"
                  onClick={() => chooseTopic(item.query)}
                  style={{ "--topic-color": item.color } as React.CSSProperties}
                >
                  <span className="topic-card-art">
                    <span />
                    <span />
                    <span />
                    <Books size={55} weight="thin" />
                  </span>
                  <span className="topic-card-bottom">
                    <strong>{item.name}</strong>
                    <ArrowUpRightIcon />
                  </span>
                </button>
              ))}
            </div>
          ) : !visible.length ? (
            <div className="empty-state">
              <Books size={36} weight="thin" />
              <h2>
                {mode === "library" && saved.length === 0
                  ? "Every library starts with one book."
                  : "Nothing on this shelf. Yet."}
              </h2>
              <p>
                {mode === "library" && saved.length === 0
                  ? "Find something you love in Discover, or add a book of your own."
                  : "Try another title, author, or reading status."}
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  if (mode === "library" && saved.length === 0)
                    switchMode("discover");
                  else {
                    setQuery("");
                    setSearch("");
                    setStatus("ALL");
                    setPage(1);
                  }
                }}
              >
                {mode === "library" && saved.length === 0
                  ? "Discover a book"
                  : "Reset filters"}
                <ArrowRight size={16} />
              </button>
            </div>
          ) : view === "shelf" ? (
            <div className="shelves">
              {groups.map((group, row) => (
                <div className="shelf-row" key={row}>
                  <div className="spine-scroll">
                    <div className="spine-line">
                      {group.map((book, i) => (
                        <Spine
                          key={`${book.id}-${book.title}-${i}`}
                          book={book}
                          index={row * 16 + i}
                          color={topics[bookHash(book) % topics.length].color}
                          onClick={() => setSelected(book)}
                        />
                      ))}
                      <div className="bookend" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="wooden-shelf" />
                  <div className="shelf-caption">
                    <span>
                      <span
                        className="topic-book"
                        style={{
                          background:
                            mode === "discover"
                              ? currentTopic.color
                              : topics[row % 8].color,
                        }}
                      />
                      {mode === "library"
                        ? "Your collection"
                        : search
                          ? `“${search}”`
                          : currentTopic.name}
                    </span>
                    <span>{group.length} books</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="covers-grid"
              style={{
                gridTemplateColumns: `repeat(${pageSize}, minmax(0, 1fr))`,
              }}
            >
              {pageBooks.map((book, i) => (
                <button
                  key={`${book.id}-${book.title}-${i}`}
                  className="cover-card"
                  onClick={() => setSelected(book)}
                >
                  <BookCover book={book} />
                  <strong>{book.title}</strong>
                  <span>{book.author}</span>
                  {saved.some((item) => titleKey(item) === titleKey(book)) && (
                    <small>In your library</small>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
        {!loading && !error && view !== "topics" && (
          <div className="collection-footer">
            <span>
              {visible.length}{" "}
              {mode === "library"
                ? "books in this view"
                : `books · Open Library · Selection ${page}`}
            </span>
            {pageCount > 1 && (
              <nav
                className="collection-pagination"
                aria-label="Collection pages"
              >
                <button
                  className="text-button"
                  disabled={currentShelfPage === 0}
                  onClick={() => setShelfPage(currentShelfPage - 1)}
                >
                  <ArrowLeft size={14} /> Previous books
                </button>
                <span aria-live="polite">
                  {currentShelfPage + 1} / {pageCount}
                </span>
                <button
                  className="text-button"
                  disabled={currentShelfPage >= pageCount - 1}
                  onClick={() => setShelfPage(currentShelfPage + 1)}
                >
                  Next books <ArrowRight size={14} />
                </button>
              </nav>
            )}
            {mode === "discover" && (
              <div className="flex gap-4">
                <button
                  className="text-button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ArrowLeft size={14} />
                  Previous
                </button>
                <button
                  className="text-button"
                  disabled={page >= 100 || catalog.length === 0}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next selection
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
            {mode === "library" && (
              <button
                className="text-button"
                onClick={() => setRetry((n) => n + 1)}
              >
                <ArrowClockwise size={14} />
                Refresh
              </button>
            )}
          </div>
        )}
      </main>
      {notice && (
        <div className="toast" role="status">
          <CheckCircle size={18} />
          {notice}
        </div>
      )}
      {selected && (
        <BookDetails
          book={selected}
          saved={saved.find((book) => titleKey(book) === titleKey(selected))}
          onClose={() => setSelected(null)}
          onSave={save}
          onRemove={remove}
          onStatus={changeStatus}
        />
      )}{" "}
      {adding && <AddBook onClose={() => setAdding(false)} onSave={save} />}
    </>
  );
}
function ArrowUpRightIcon() {
  return <ArrowRight size={20} style={{ transform: "rotate(-35deg)" }} />;
}
