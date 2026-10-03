import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const alt = "Vina — meetvina.app";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#F6F5F1",
          padding: "80px 100px",
          fontFamily: "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img
            src={logoBase64}
            alt="Vina Logo"
            width={56}
            height={56}
            style={{ objectFit: "contain" }}
          />
          <span style={{ fontSize: 40, fontWeight: 600, color: "#1E2530", letterSpacing: "-0.02em" }}>
            Vina
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 500,
              color: "#1E2530",
              lineHeight: 1.15,
              maxWidth: 900,
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Turn a job description into a letter worth sending.
          </h1>
          <p
            style={{
              fontSize: 26,
              fontFamily: "sans-serif",
              color: "#68655C",
              margin: 0,
              maxWidth: 820,
              lineHeight: 1.4,
            }}
          >
            Vina reads the posting, identifies what the team is actually looking for, and drafts a genuine, targeted letter in seconds.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "sans-serif",
            fontSize: 20,
            color: "#68655C",
            borderTop: "1px solid #DEDAD0",
            width: "100%",
            paddingTop: 32,
          }}
        >
          <span>meetvina.app</span>
          <span>•</span>
          <span>Personal correspondence for thoughtful job applications</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
