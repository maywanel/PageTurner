import Link from "next/link";
export function ErrorPage({ code = "404" }: { code?: string }) {
  return (
    <main id="main-content" className="error-page">
      <span className="wordmark">PageTurner</span>
      <span className="error-code">{code}</span>
      <h1>
        {code === "403"
          ? "A private chapter."
          : code === "500"
            ? "We lost our place."
            : "This page slipped away."}
      </h1>
      <p>
        {code === "403"
          ? "This part of the library is reserved for administrators."
          : code === "500"
            ? "Something went wrong. Please return to the library and try again."
            : "The page you’re looking for isn’t on this shelf."}
      </p>
      <Link className="primary-button" href="/home">
        Back to the library
      </Link>
      <Link className="text-button mt-5" href="/login">
        Sign in to another account
      </Link>
    </main>
  );
}
