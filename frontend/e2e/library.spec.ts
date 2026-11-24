import { test, expect } from "@playwright/test";
import type { Book } from "../lib/types";
const titles = [
  "A Room of One’s Own",
  "The Secret Garden",
  "Pride and Prejudice",
  "The Art of War",
  "The Picture of Dorian Gray",
  "Walden",
  "Little Women",
  "Meditations",
  "The Great Gatsby",
  "The Waves",
  "A Tale of Two Cities",
  "The Odyssey",
  "Jane Eyre",
  "The Age of Innocence",
  "The Time Machine",
  "The Adventures of Sherlock Holmes",
  "Leaves of Grass",
  "The Wind in the Willows",
  "Frankenstein",
  "The Sun Also Rises",
  "The Wonderful Wizard of Oz",
  "The Call of the Wild",
  "Persuasion",
  "The Jungle Book",
];
const authors = [
  "Virginia Woolf",
  "Frances Hodgson Burnett",
  "Jane Austen",
  "Sun Tzu",
  "Oscar Wilde",
  "Henry David Thoreau",
  "Louisa May Alcott",
  "Marcus Aurelius",
  "F. Scott Fitzgerald",
  "Virginia Woolf",
  "Charles Dickens",
  "Homer",
  "Charlotte Brontë",
  "Edith Wharton",
  "H. G. Wells",
  "Arthur Conan Doyle",
  "Walt Whitman",
  "Kenneth Grahame",
  "Mary Shelley",
  "Ernest Hemingway",
  "L. Frank Baum",
  "Jack London",
  "Jane Austen",
  "Rudyard Kipling",
];
const catalog: Book[] = titles.map((title, i) => ({
  title,
  author: authors[i],
  description: "A classic work, ready to find a place on your bookshelf.",
  isbn: "N/A",
}));
test("library interactions, empty states, keyboard dialog, and responsive layouts", async ({
  page,
}) => {
  let saved: Book[] = [];
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/users/me", (route) =>
    route.fulfill({
      json: {
        id: 1,
        name: "Test Reader",
        email: "reader@example.test",
        role: "USER",
      },
    }),
  );
  await page.route("**/api/csrf", (route) =>
    route.fulfill({ json: { headerName: "X-CSRF-TOKEN", token: "test" } }),
  );
  await page.route("**/books/search?**", (route) =>
    route.fulfill({ json: catalog }),
  );
  await page.route(/\/books(?:\/\d+(?:\/status)?)?$/, async (route) => {
    const method = route.request().method();
    if (method === "POST") {
      const book = {
        ...route.request().postDataJSON(),
        id: 1,
        readingStatus: "WANT_TO_READ",
      };
      saved.push(book);
      await route.fulfill({ json: book });
    } else if (method === "PATCH") {
      saved[0] = { ...saved[0], ...route.request().postDataJSON() };
      await route.fulfill({ json: saved[0] });
    } else if (method === "DELETE") {
      saved = [];
      await route.fulfill({ status: 204 });
    } else await route.fulfill({ json: saved });
  });
  await page.goto("/home");
  await expect(
    page.getByRole("button", { name: "Open A Room of One’s Own", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "../.impeccable/review/desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Open A Room of One’s Own", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "../.impeccable/review/book-detail.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Add to your library", exact: true })
    .click();
  await expect(
    page.getByText("In your library", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Reading status", { exact: true })
    .selectOption("READING");
  await expect(
    page.getByRole("combobox", { name: "Reading status", exact: true }),
  ).toHaveValue("READING");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open A Room of One’s Own", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Your library", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your library", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search your library", { exact: true }).fill("missing");
  await expect(page.getByText("Nothing on this shelf. Yet.")).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page
    .getByRole("button", { name: "Open A Room of One’s Own", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Reading status", exact: true }),
  ).toHaveValue("READING");
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove from shelf", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByText("Every library starts with one book."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Discover a book" }).click();
  await page.getByRole("button", { name: "Covers", exact: true }).click();
  await expect(page.locator(".cover-card")).toHaveCount(5);
  await page.getByRole("button", { name: "Next books", exact: true }).click();
  await expect(page.locator(".cover-card").first()).toContainText("Walden");
  await page.getByRole("button", { name: "Topics", exact: true }).click();
  await expect(page.locator(".topic-card")).toHaveCount(8);
  await page.locator(".topic-card").filter({ hasText: "Science" }).click();
  await expect(page.locator(".spine-line button")).toHaveCount(19);
  await page.getByRole("button", { name: "Next books", exact: true }).click();
  await expect(page.locator(".spine-line button")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Previous books", exact: true })
    .click();
  await page.setViewportSize({ width: 1366, height: 768 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= innerHeight,
    ),
  ).toBe(true);
  await expect(page.locator(".toast")).toHaveCount(0, { timeout: 6000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "../.impeccable/review/mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Open A Room of One’s Own", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.screenshot({
    path: "../.impeccable/review/mobile-detail.png",
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page.goto("/login?expired=1");
  await expect(page.getByRole("status")).toHaveText(
    "Your session ended. Sign in to continue.",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeInViewport();
  await page.goto("/login");
  await page.screenshot({
    path: "../.impeccable/review/mobile-login.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "../.impeccable/review/login.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
