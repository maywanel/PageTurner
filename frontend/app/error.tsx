"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="error-page">
      <h1>We lost our place.</h1>
      <p>The page could not load. Let’s try once more.</p>
      <button className="primary-button" onClick={reset}>
        Try again
      </button>
      <a className="text-button mt-5" href="/home">
        Back to the library
      </a>
    </main>
  );
}
