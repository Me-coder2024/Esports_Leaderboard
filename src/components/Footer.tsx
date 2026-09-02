"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(135deg, #0A1F44, #0D2B5E)",
        color: "white",
        padding: "24px 24px",
        marginTop: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Image
            src="/parul-university-logo.jpg"
            alt="Parul University"
            width={40}
            height={40}
            style={{ borderRadius: 6, objectFit: "contain", background: "white", padding: 2 }}
          />
          <div>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600 }}>Parul University</p>
            <p style={{ margin: 0, fontSize: "0.65rem", opacity: 0.6 }}>Esports Division</p>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: "0.7rem", opacity: 0.5, textAlign: "center" }}>
          © {new Date().getFullYear()} Tournament Scoreboard. All rights reserved.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 600 }}>Lakshya 2047</p>
            <p style={{ margin: 0, fontSize: "0.65rem", opacity: 0.6 }}>Center for Future Skills</p>
          </div>
          <Image
            src="/lakshya-connect-logo.jpg"
            alt="Lakshya 2047"
            width={40}
            height={40}
            style={{ borderRadius: 6, objectFit: "contain", background: "white", padding: 2 }}
          />
        </div>
      </div>
    </footer>
  );
}
