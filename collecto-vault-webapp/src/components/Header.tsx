// // import React from "react";

// type Props = {
//   name: string;
//   phone?: string;
//   avatar?: string;
//   useVideo?: boolean;
//   useTexture?: boolean;
// };

// export default function Header({
//   name,
//   phone,
//   avatar,
//   useVideo = false,
//   useTexture = false,
// }: Props) {
//   return (
//     <header className={`relative w-full overflow-hidden ${useTexture ? "" : ""}`}>
//       {/* background (video optional) */}
//       {useVideo && (
//         <video
//           className="absolute inset-0 w-full h-full object-cover pointer-events-none filter brightness-50 blur-sm"
//           autoPlay
//           muted
//           loop
//           playsInline
//         >
//           <source src="/video.mp4" type="video/mp4" />
//         </video>
//       )}

//       {/* gradient overlay */}
//       <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-sky-700 opacity-95" />

//       <div className="relative max-w-3xl mx-auto px-4 pb-2 pt-3">
//         <div className="flex items-start justify-between">
//           <button className="p-2 text-white/90" aria-label="menu">
//             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
//               <path d="M4 6h16M4 12h16M4 18h16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>

//           {/* empty spacer so avatar can be centered */}
//           <div className="w-8" />

//           <button className="p-2 text-white/90" aria-label="options">
//             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
//               <path d="M12 6v.01M12 12v.01M12 18v.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
//             </svg>
//           </button>
//         </div>

//         {/* avatar centered and overlapping below header */}
//         <div className="flex justify-center">
//           <div className="avatar-ring -mt-8">
//             <img src={avatar ?? "/images/avatar-placeholder.jpg"} alt="avatar" className="rounded-full" />
//           </div>
//         </div>

//         <div className="text-center mt-1 pb-4">
//           <h1 className="text-white text-xl md:text-2xl font-semibold">{name}</h1>
//           {phone && <p className="text-white/90 text-sm mt-1">{phone}</p>}
//           <div className="mt-1 text-xs text-white/70">My Statement</div>
//         </div>
//       </div>
//     </header>
//   );
// }
import { useNavigate } from "react-router-dom";

type Props = {
  name: string;
  phone?: string;
  avatar?: string;
  useVideo?: boolean;
  useTexture?: boolean;
  avatarSize?: number;
};

export default function Header({
  name,
  phone,
  avatar,
  useVideo = false,
  avatarSize = 180,
}: Props) {
  const navigate = useNavigate();

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

      <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-sky-700 opacity-95" />

      <div className="relative max-w-3xl mx-auto px-4 pb-2 pt-3">
        {/* empty header bar since icons were removed */}
        <div className="flex items-start justify-between h-8">
          <div className="w-8" />
          <div className="w-8" />
        </div>

        {/* avatar */}
        <div className="flex justify-center">
          <div
            className="rounded-full overflow-hidden shadow-lg border-4 border-white/40 -mt-8"
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
