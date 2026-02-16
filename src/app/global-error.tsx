'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-white flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-neutral-400 mb-6">
            An unexpected error occurred. Your data is safe.
          </p>
          {error.digest && (
            <p className="text-xs text-neutral-500 mb-4 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-neutral-200 transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-4 py-2 border border-neutral-700 rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
