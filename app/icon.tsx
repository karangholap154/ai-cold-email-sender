import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F5F1",
          borderRadius: 6,
          border: "1px solid #DEDAD0",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontFamily: "serif",
            fontWeight: 600,
            color: "#1E2530",
          }}
        >
          V
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
