import React from "react";

interface SunLogoProps {
  className?: string;
  size?: number;
}

export function SunLogo({ className = "", size = 56 }: SunLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Center circle */}
      <circle cx="32" cy="32" r="12" fill="#F59E0B" />
      
      {/* Sun rays */}
      {/* Top */}
      <path
        d="M32 2L34 14L32 15L30 14L32 2Z"
        fill="#FBBF24"
      />
      {/* Top-right */}
      <path
        d="M51.799 12.201L43.556 20.444L42.142 19.03L43.556 17.616L51.799 12.201Z"
        fill="#FBBF24"
      />
      {/* Right */}
      <path
        d="M62 32L50 30L49 32L50 34L62 32Z"
        fill="#FBBF24"
      />
      {/* Bottom-right */}
      <path
        d="M51.799 51.799L43.556 43.556L44.97 42.142L46.384 43.556L51.799 51.799Z"
        fill="#FBBF24"
      />
      {/* Bottom */}
      <path
        d="M32 62L30 50L32 49L34 50L32 62Z"
        fill="#FBBF24"
      />
      {/* Bottom-left */}
      <path
        d="M12.201 51.799L20.444 43.556L21.858 44.97L20.444 46.384L12.201 51.799Z"
        fill="#FBBF24"
      />
      {/* Left */}
      <path
        d="M2 32L14 34L15 32L14 30L2 32Z"
        fill="#FBBF24"
      />
      {/* Top-left */}
      <path
        d="M12.201 12.201L20.444 20.444L19.03 21.858L17.616 20.444L12.201 12.201Z"
        fill="#FBBF24"
      />
      
      {/* Inner glow rays */}
      <circle cx="32" cy="32" r="16" fill="#F59E0B" opacity="0.3" />
    </svg>
  );
}

