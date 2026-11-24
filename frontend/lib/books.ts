import type { Book } from "./types";
export const topics = [
  { name: "Fiction", query: "fiction", color: "#65518c" },
  { name: "Science", query: "science", color: "#416551" },
  { name: "Philosophy", query: "philosophy", color: "#957345" },
  { name: "History", query: "history", color: "#874852" },
  { name: "Art & design", query: "art", color: "#4d7280" },
  { name: "Poetry", query: "poetry", color: "#926282" },
  { name: "Technology", query: "computers", color: "#526579" },
  { name: "Nature", query: "nature", color: "#747a45" },
];
export function bookHash(book: Book) {
  return Array.from(book.title).reduce(
    (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
    0,
  );
}
export function titleKey(book: Book) {
  return book.title.trim().toLocaleLowerCase();
}
export const previewBooks: Book[] = [
  { title: "A Room of One’s Own", author: "Virginia Woolf" },
  { title: "The Secret Garden", author: "Frances Hodgson Burnett" },
  { title: "Pride and Prejudice", author: "Jane Austen" },
  { title: "The Art of War", author: "Sun Tzu" },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde" },
  { title: "Walden", author: "Henry David Thoreau" },
  { title: "Little Women", author: "Louisa May Alcott" },
  { title: "Meditations", author: "Marcus Aurelius" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
];
export function readingUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      [
        "archive.org",
        "www.archive.org",
        "openlibrary.org",
        "www.openlibrary.org",
      ].includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function selectBooks(
  books: Book[],
  { query = "", status = "ALL", sort = "default", personal = true } = {},
) {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return books
    .filter(
      (book) =>
        (!personal ||
          status === "ALL" ||
          (book.readingStatus || "WANT_TO_READ") === status) &&
        (!personal ||
          normalize(`${book.title} ${book.author}`).includes(normalize(query))),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? (a.id || 0) - (b.id || 0)
        : sort === "title-desc"
          ? b.title.localeCompare(a.title)
          : sort === "status"
            ? ["WANT_TO_READ", "READING", "FINISHED"].indexOf(
                a.readingStatus || "WANT_TO_READ",
              ) -
              ["WANT_TO_READ", "READING", "FINISHED"].indexOf(
                b.readingStatus || "WANT_TO_READ",
              )
            : sort === "title"
              ? a.title.localeCompare(b.title)
              : sort === "author"
                ? a.author.localeCompare(b.author)
                : sort === "color"
                  ? (bookHash(a) % 8) - (bookHash(b) % 8)
                  : personal
                    ? (b.id || 0) - (a.id || 0)
                    : 0,
    );
}
