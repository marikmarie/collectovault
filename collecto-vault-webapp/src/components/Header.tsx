import React, { useRef, useState } from "react";
// import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

type Props = {
  name: string;
  phone?: string;
  avatar?: string;
  useVideo?: boolean;
  avatarSize?: number;
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
  //const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);


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
    <header className="relative w-full overflow-hidden m-0 p-0">
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

      {/* base gradient - Expanded to full width/height */}
      <div className="themed-header__bg" />

      {/* Decorative SVG layer removed */}

      {/* Main Content Container - keep flush under TopNav (no top padding) */}
      <div className="relative w-full px-4 pb-0 pt-0">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* Avatar with camera upload - Removed negative margin to prevent top clipping */}
        <div className="flex justify-center">
          <div className="relative">
            <div
              className="rounded-full overflow-hidden shadow-lg border-4 border-white/40 flex items-center justify-center"
              style={{
                width: avatarSize,
                height: avatarSize,
              }}
            >
              {imageError || !avatar ? (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-bold text-center px-4">NO IMAGE</span>
                </div>
              ) : (
                <img
                  src={avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              )}
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

        {/* Text content */}
        <div className="text-center mt-3 pb-2 relative z-10">
          <h1 className="text-white text-xl md:text-2xl font-semibold">{name}</h1>
          {phone && <p className="text-white/90 text-sm mt-1">{phone}</p>}

          {/* <button
            onClick={() => navigate("/statement")}
            className="mt-3 text-xs text-white bg-white/20 px-4 py-1.5 rounded-full hover:bg-white/30 active:scale-95 transition-all border border-white/10"
          >
            My Statement
          </button> */}
        </div>
      </div>
    </header>
  );
}