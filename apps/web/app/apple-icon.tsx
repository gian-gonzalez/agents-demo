import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

/** MangoMark sobre papel crema. */
export default function AppleIcon() {
  return new ImageResponse(
    <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <rect fill="#FAF8F2" height="64" width="64" />
      <g transform="rotate(-18 32 34)">
        <ellipse cx="32" cy="36" fill="#FFB21A" rx="21" ry="25" />
        <path d="M44 14c8 6 11 18 7 30-3 9-9 15-17 17 10-6 15-16 15-27 0-8-2-14-5-20Z" fill="#FF6B1A" />
        <path d="M31 11c-1-5 2-9 7-10-1 4 0 7 3 9-4 1-7 1-10 1Z" fill="#1F7A45" />
      </g>
      <g transform="rotate(-14 34 40)">
        <ellipse cx="34" cy="40" fill="#FFFFFF" rx="14" ry="10" />
        <path d="M27.5 40.5l4.5 4.5 8.5-9" stroke="#1F7A45" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      </g>
    </svg>,
    size,
  );
}
