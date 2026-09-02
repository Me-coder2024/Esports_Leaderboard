"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="app-header">
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
          gap: 16,
        }}
      >
        {/* Parul University Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <Image
            src="/parul-university-logo.jpg"
            alt="Parul University"
            width={52}
            height={52}
            style={{ borderRadius: 6, objectFit: "contain", background: "white", padding: 2 }}
          />
        </Link>

        {/* Center Title */}
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "inherit",
            textAlign: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.06em",
              margin: 0,
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            TOURNAMENT SCOREBOARD
          </h1>
          <p
            style={{
              fontSize: "0.65rem",
              opacity: 0.7,
              margin: 0,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Free Fire &amp; BGMI Esports
          </p>
        </Link>

        {/* Lakshya 2047 Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
          <Image
            src="/lakshya-connect-logo.jpg"
            alt="Lakshya 2047 — Center for Future Skills"
            width={52}
            height={52}
            style={{ borderRadius: 6, objectFit: "contain", background: "white", padding: 2 }}
          />
        </Link>
      </div>
    </header>
  );
}
