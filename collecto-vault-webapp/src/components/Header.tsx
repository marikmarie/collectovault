import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

type Props = {
  name: string;
  phone?: string;
  // The avatar prop accepts a URL string or null/undefined.
  avatar?: string;
  useVideo?: boolean;
  avatarSize?: number;
  // Handles the file change event after selection
  onAvatarFileChange: (file: File | null) => void;
};

export default function Header({
  name,
  phone,
  avatar,
  useVideo = false,
  avatarSize = 180,
  onAvatarFileChange,
}: Props) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customGradient =
    "linear-gradient(to right top, #18010e, #2b0a1f, #3f0b31, #530a46, #67095d, #880666, #aa056b, #cb0d6c, #ef4155, #ff743c, #ffa727, #f2d931)";

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onAvatarFileChange(file);
    if (event.target.files) {
      event.target.value = "";
    }
  };

  return (
    <header className="relative w-full overflow-hidden">
      {/* optional background video */}
      {useVideo && (
        <video
          className="absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-50 blur-sm"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
      )}

      {/* base gradient */}
      <div
        className="absolute inset-0 opacity-95 pointer-events-none"
        style={{ background: customGradient }}
      />

      {/* --- Decorative SVG layer (diagonal lines + soft curves) --- */}
      <div className="absolute inset-0 pointer-events-none">
        <svg
          className="w-full h-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            {/* diagonal stripe pattern */}
            <pattern
              id="diagStripes"
              patternUnits="userSpaceOnUse"
              width="40"
              height="40"
              patternTransform="rotate(25)"
            >
              <rect width="40" height="40" fill="transparent" />
              <path d="M0 0 L0 6" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
              <path d="M10 0 L10 6" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
            </pattern>

            {/* soft blurred gradient for curves */}
            <linearGradient id="softGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ff6b6b" stopOpacity="0.08" />
              <stop offset="55%" stopColor="#ffb86b" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#7c4dff" stopOpacity="0.04" />
            </linearGradient>

            <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="18" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* diagonal stripe rectangle (very subtle) */}
          <rect width="100%" height="100%" fill="url(#diagStripes)" />

          {/* abstract soft curved shapes (low opacity, blurred) */}
          <g filter="url(#softBlur)">
            <path
              d="M -10 40 C 120 10, 240 10, 400 60 C 560 110, 720 160, 1000 120 L 1000 0 L -10 0 Z"
              fill="url(#softGrad)"
              transform="translate(0,40) scale(1.15)"
              opacity="0.28"
            />
            <path
              d="M -20 220 C 120 180, 260 140, 430 190 C 600 240, 800 300, 1100 260 L 1100 0 L -20 0 Z"
              fill="#7b61ff"
              transform="translate(0,80) scale(1.05)"
              opacity="0.06"
            />
            <path
              d="M 100 420 C 240 380, 380 360, 560 420 C 740 480, 920 520, 1200 480 L 1200 0 L 100 0 Z"
              fill="#ff6b6b"
              transform="translate(-80,140) scale(1.1)"
              opacity="0.04"
            />
          </g>

          {/* a subtle vignette using an overlay circle gradient */}
          <radialGradient id="vignette" cx="50%" cy="10%" r="80%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
          </radialGradient>
          <rect width="100%" height="100%" fill="url(#vignette)" opacity="0.25" />
        </svg>
      </div>

      <div className="relative max-w-3xl mx-auto px-4 pb-2 pt-3">
        {/* Hidden file input for uploading */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* empty header bar (icons removed already) */}
        <div className="flex items-start justify-between h-8">
          <div className="w-8" />
          <div className="w-8" />
        </div>

        {/* Avatar with camera upload */}
        <div className="flex justify-center">
          <div className="relative -mt-8">
            <div
              className="rounded-full overflow-hidden shadow-lg border-4 border-white/40"
              style={{
                width: avatarSize,
                height: avatarSize,
              }}
            >
              <img
                src={avatar ?? "/images/avatar-placeholder.jpg"}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={handleCameraClick}
              className="absolute bottom-0 right-0 p-2 bg-[#8b8487] text-white rounded-full shadow-lg border-2 border-white/70 hover:bg-[#c01754] transition-colors z-10 transform translate-x-1 translate-y-1"
              aria-label="Upload new profile picture"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* text */}
        <div className="text-center mt-2 pb-4 relative z-10">
          <h1 className="text-white text-xl md:text-2xl font-semibold">{name}</h1>

          {phone && <p className="text-white/90 text-sm mt-1">{phone}</p>}

          <button
            onClick={() => navigate("/statement")}
            className="mt-2 text-xs text-white bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 active:scale-95 transition-all"
          >
            My Statement
          </button>
        </div>
      </div>
    </header>
  );
}
