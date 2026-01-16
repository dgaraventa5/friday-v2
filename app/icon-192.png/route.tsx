import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'white',
        }}
      >
        <svg
          width="150"
          height="150"
          viewBox="0 0 64 64"
          fill="none"
        >
          {/* Center circle */}
          <circle cx="32" cy="32" r="12" fill="#FDE047" />

          {/* Inner glow */}
          <circle cx="32" cy="32" r="16" fill="#FDE047" opacity="0.3" />

          {/* Sun rays */}
          <path d="M32 2L34 14L32 15L30 14L32 2Z" fill="#FEF08A" />
          <path d="M51.799 12.201L43.556 20.444L42.142 19.03L43.556 17.616L51.799 12.201Z" fill="#FEF08A" />
          <path d="M62 32L50 30L49 32L50 34L62 32Z" fill="#FEF08A" />
          <path d="M51.799 51.799L43.556 43.556L44.97 42.142L46.384 43.556L51.799 51.799Z" fill="#FEF08A" />
          <path d="M32 62L30 50L32 49L34 50L32 62Z" fill="#FEF08A" />
          <path d="M12.201 51.799L20.444 43.556L21.858 44.97L20.444 46.384L12.201 51.799Z" fill="#FEF08A" />
          <path d="M2 32L14 34L15 32L14 30L2 32Z" fill="#FEF08A" />
          <path d="M12.201 12.201L20.444 20.444L19.03 21.858L17.616 20.444L12.201 12.201Z" fill="#FEF08A" />
        </svg>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  )
}
