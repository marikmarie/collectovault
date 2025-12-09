import React, { useRef } from "react"; // Import React and useRef
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

type Props = {
  name: string;
  phone?: string;
  // Note: The avatar prop now accepts a URL string or null/undefined.
  avatar?: string; 
  useVideo?: boolean;
  avatarSize?: number;
  // This prop should now handle the file change event after selection
  onAvatarFileChange: (file: File | null) => void; 
};

export default function Header({
  name,
  phone,
  avatar,
  useVideo = false,
  avatarSize = 180,
  onAvatarFileChange, // Changed prop name to reflect its new role
}: Props) {
  const navigate = useNavigate();
  // 1. Create a ref to access the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customGradient =
    "linear-gradient(to right top, #18010e, #2b0a1f, #3f0b31, #530a46, #67095d, #880666, #aa056b, #cb0d6c, #ef4155, #ff743c, #ffa727, #f2d931)";

  // 2. Function to manually trigger the hidden file input click
  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // 3. Function to process the selected file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onAvatarFileChange(file);
    // Clear the input value so the same file can be uploaded again if needed
    if (event.target.files) {
      event.target.value = '';
    }
  };

  return (
    <header className="relative w-full overflow-hidden">
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

      <div
        className="absolute inset-0 opacity-95"
        style={{ background: customGradient }}
      />

      <div className="relative max-w-3xl mx-auto px-4 pb-2 pt-3">
        {/* Hidden file input for uploading */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {/* empty header bar since icons were removed */}
        <div className="flex items-start justify-between h-8">
          <div className="w-8" />
          <div className="w-8" />
        </div>

        {/* 📸 Avatar with Upload Button */}
        <div className="flex justify-center">
          <div className="relative -mt-8">
            {/* Avatar container */}
            <div
              className="rounded-full overflow-hidden shadow-lg border-4 border-white/40"
              style={{
                width: avatarSize,
                height: avatarSize,
              }}
            >
              <img
                // Use the provided avatar URL or the placeholder if not present
                src={avatar ?? "/images/avatar-placeholder.jpg"}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Camera Upload Button */}
            <button
              onClick={handleCameraClick} // Call the function to trigger file input
              className="absolute bottom-0 right-0 p-2 bg-[#d81b60] text-white rounded-full shadow-lg border-2 border-white/70 hover:bg-[#c01754] transition-colors z-10 transform translate-x-1 translate-y-1"
              aria-label="Upload new profile picture"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>

        {/* text */}
        <div className="text-center mt-2 pb-4">
          <h1 className="text-white text-xl md:text-2xl font-semibold">
            {name}
          </h1>

          {phone && (
            <p className="text-white/90 text-sm mt-1">{phone}</p>
          )}

          {/* 🔵 My Statement button */}
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