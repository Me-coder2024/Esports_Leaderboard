"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid passcode");
        return;
      }

      router.push("/score");
      router.refresh();
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          className="animate-fade-in"
          style={{
            maxWidth: 420,
            width: "100%",
          }}
        >
          <div
            style={{
              textAlign: "center",
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, var(--navy-900), var(--navy-700))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                fontSize: "1.8rem",
              }}
            >
              🔐
            </div>
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2rem",
                color: "var(--navy-900)",
                letterSpacing: "0.04em",
                margin: "0 0 8px",
              }}
            >
              SCORER LOGIN
            </h1>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                margin: 0,
              }}
            >
              Enter the admin passcode to access the scoring dashboard
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-default)",
              borderRadius: 16,
              padding: 32,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="passcode">
                Admin Passcode
              </label>
              <input
                id="passcode"
                type="password"
                className="input-field"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError("");
                }}
                autoFocus
                required
                style={{ fontSize: "1.1rem", textAlign: "center", letterSpacing: "0.15em" }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#FEF2F2",
                  color: "#B91C1C",
                  borderRadius: 8,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading || !passcode}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Verifying...
                </>
              ) : (
                "🚀 Access Dashboard"
              )}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            Contact the tournament organizer if you don&apos;t have the passcode
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
