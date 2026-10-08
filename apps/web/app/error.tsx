"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main><h1>Signal Passport</h1><p>The web interface could not load. No publication is confirmed.</p>
    <button onClick={reset}>Try loading again</button></main>;
}
