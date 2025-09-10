import React from 'react'

interface PennyMarkProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  animated?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

export function PennyMark({ className = '', size = 'md', animated = false }: PennyMarkProps) {
  return (
    <div className={`${sizeClasses[size]} ${className} ${animated ? 'animate-pulse' : ''}`}>
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Butterfly */}
        <g transform="translate(85, 15) scale(0.6)">
          <path
            d="M10 15C8 10 12 8 15 10C18 8 22 10 20 15C22 20 18 22 15 20C12 22 8 20 10 15Z"
            fill="#F4C430"
            stroke="#2C2C2C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M15 10L15 25"
            stroke="#2C2C2C"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M12 22L18 22"
            stroke="#2C2C2C"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>

        {/* Penny's body (pig) */}
        <ellipse
          cx="60"
          cy="75"
          rx="35"
          ry="25"
          fill="#F2A6A6"
          stroke="#2C2C2C"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Penny's head */}
        <circle
          cx="60"
          cy="45"
          r="28"
          fill="#F2A6A6"
          stroke="#2C2C2C"
          strokeWidth="3"
        />

        {/* Snout */}
        <ellipse
          cx="60"
          cy="52"
          rx="12"
          ry="8"
          fill="#E35C4A"
          stroke="#2C2C2C"
          strokeWidth="2"
        />
        
        {/* Nostrils */}
        <circle cx="56" cy="52" r="2" fill="#2C2C2C" />
        <circle cx="64" cy="52" r="2" fill="#2C2C2C" />

        {/* Eyes */}
        <circle cx="52" cy="40" r="4" fill="#2C2C2C" />
        <circle cx="68" cy="40" r="4" fill="#2C2C2C" />
        <circle cx="53" cy="39" r="1.5" fill="white" />
        <circle cx="69" cy="39" r="1.5" fill="white" />

        {/* Ears */}
        <path
          d="M42 35C40 30 45 28 48 32"
          fill="#F2A6A6"
          stroke="#2C2C2C"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M78 35C80 30 75 28 72 32"
          fill="#F2A6A6"
          stroke="#2C2C2C"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Legs */}
        <rect x="45" y="95" width="6" height="12" rx="3" fill="#2C2C2C" />
        <rect x="55" y="95" width="6" height="12" rx="3" fill="#2C2C2C" />
        <rect x="65" y="95" width="6" height="12" rx="3" fill="#2C2C2C" />
        <rect x="75" y="95" width="6" height="12" rx="3" fill="#2C2C2C" />

        {/* Hooves */}
        <rect x="44" y="105" width="8" height="4" rx="2" fill="#2C2C2C" />
        <rect x="54" y="105" width="8" height="4" rx="2" fill="#2C2C2C" />
        <rect x="64" y="105" width="8" height="4" rx="2" fill="#2C2C2C" />
        <rect x="74" y="105" width="8" height="4" rx="2" fill="#2C2C2C" />

        {/* Tail */}
        <path
          d="M95 75C100 70 105 75 100 80C105 85 100 90 95 85"
          fill="none"
          stroke="#2C2C2C"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Flowers on head */}
        {/* Coral flower */}
        <g transform="translate(48, 20)">
          <path
            d="M8 12C6 8 10 6 12 8C14 6 18 8 16 12C18 16 14 18 12 16C10 18 6 16 8 12Z"
            fill="#E35C4A"
            stroke="#2C2C2C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2" fill="#F4C430" />
        </g>

        {/* Teal flower */}
        <g transform="translate(65, 18)">
          <path
            d="M8 12C6 8 10 6 12 8C14 6 18 8 16 12C18 16 14 18 12 16C10 18 6 16 8 12Z"
            fill="#4A9D9C"
            stroke="#2C2C2C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2" fill="white" />
        </g>

        {/* Yellow flower */}
        <g transform="translate(55, 15)">
          <path
            d="M8 12C6 8 10 6 12 8C14 6 18 8 16 12C18 16 14 18 12 16C10 18 6 16 8 12Z"
            fill="#F4C430"
            stroke="#2C2C2C"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="2" fill="#E35C4A" />
        </g>

        {/* Small white flower */}
        <g transform="translate(72, 25)">
          <circle cx="6" cy="6" r="4" fill="white" stroke="#2C2C2C" strokeWidth="1.5" />
          <circle cx="6" cy="6" r="1.5" fill="#F4C430" />
        </g>

        {/* Flower stems/leaves */}
        <path
          d="M60 30L58 25M65 32L67 27M75 35L77 30"
          stroke="#4A9D9C"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export default PennyMark
