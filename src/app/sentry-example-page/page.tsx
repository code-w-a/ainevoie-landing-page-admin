"use client";

export default function SentryExamplePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sentry Example Page</h1>
      <p>Use this button to trigger a sample client-side error.</p>
      <button
        type="button"
        onClick={() => {
          throw new Error("This is a test error from /sentry-example-page");
        }}
        style={{
          marginTop: "1rem",
          border: "1px solid #111",
          borderRadius: "8px",
          padding: "0.6rem 1rem",
          cursor: "pointer",
        }}
      >
        Throw Sample Error
      </button>
    </main>
  );
}
