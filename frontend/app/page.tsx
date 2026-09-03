"use client";

import { useEffect, useState } from "react";

// This page's ONLY job right now is to prove the full stack is wired
// correctly end-to-end: browser -> Next.js -> FastAPI -> JSON response.
// We deliberately keep it this simple before adding real dashboard UI,
// same reasoning as keeping backend/app/main.py minimal at first.
export default function Home() {
  const [status, setStatus] = useState<string>("checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => setStatus(`${data.app} backend is ${data.status}`))
      .catch(() => setStatus("Could not reach backend. Is uvicorn running?"));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-bold mb-4">PricePilot AI</h1>
      <p className="text-slate-600">{status}</p>
    </main>
  );
}
