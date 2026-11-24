export type ReadingStatus = "WANT_TO_READ" | "READING" | "FINISHED";
export type Book = {
  id?: number;
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  coverId?: number | string;
  readingStatus?: ReadingStatus;
};
export type User = { id: number; name: string; email: string; role: string };
export type ReadingOption = {
  label: string;
  url: string;
  differentEdition?: boolean;
};
export const statuses: Record<ReadingStatus, string> = {
  WANT_TO_READ: "Want to read",
  READING: "Reading now",
  FINISHED: "Finished",
};
export const isAdmin = (user?: User | null) =>
  user?.role === "SUPER_ADMIN";
