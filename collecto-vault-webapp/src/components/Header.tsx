
// import { useNavigate } from "react-router-dom";

// type Props = {
//   name: string;
//   phone?: string;
//   avatar?: string;
//   useVideo?: boolean;
//   useTexture?: boolean;
//   avatarSize?: number;
// };

// export default function Header({
//   name,
//   phone,
//   avatar,
//   useVideo = false,
//   avatarSize = 180,
// }: Props) {
//   const navigate = useNavigate();

//   return (
//     <header className="relative w-full overflow-hidden">
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

//       <div className="absolute inset-0 bg-linear-to-b from-slate-800 to-sky-700 opacity-95" />

//       <div className="relative max-w-3xl mx-auto px-4 pb-2 pt-3">
//         {/* empty header bar since icons were removed */}
//         <div className="flex items-start justify-between h-8">
//           <div className="w-8" />
//           <div className="w-8" />
//         </div>

//         {/* avatar */}
//         <div className="flex justify-center">
//           <div
//             className="rounded-full overflow-hidden shadow-lg border-4 border-white/40 -mt-8"
//             style={{
//               width: avatarSize,
//               height: avatarSize,
//             }}
//           >
//             <img
//               src={avatar ?? "/images/avatar-placeholder.jpg"}
//               alt="avatar"
//               className="w-full h-full object-cover"
//             />
//           </div>
//         </div>

//         {/* text */}
//         <div className="text-center mt-2 pb-4">
//           <h1 className="text-white text-xl md:text-2xl font-semibold">
//             {name}
//           </h1>

//           {phone && (
//             <p className="text-white/90 text-sm mt-1">{phone}</p>
//           )}

//           {/* 🔵 My Statement button */}
//           <button
//             onClick={() => navigate("/statement")}
//             className="mt-2 text-xs text-white bg-white/20 px-3 py-1 rounded-full hover:bg-white/30 active:scale-95 transition-all"
//           >
//             My Statement
//           </button>
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
  useTexture?: boolean; // Kept in Props for completeness, though unused in the return
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

  // Define the custom gradient string using the provided color stops
  // Note: Since Tailwind CSS doesn't support 12-stop gradients directly via utility classes,
  // we'll use an inline style for the background, applying the gradient directly.
  const customGradient =
    "linear-gradient(to right top, #18010e, #2b0a1f, #3f0b31, #530a46, #67095d, #880666, #aa056b, #cb0d6c, #ef4155, #ff743c, #ffa727, #f2d931)";

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

      {/* 🌟 Gradient Overlay Updated! 🌟 */}
      {/* The `bg-linear-to-b from-slate-800 to-sky-700 opacity-95` classes are replaced
          by an inline style using the new custom gradient. */}
      <div
        className="absolute inset-0 opacity-95"
        style={{ background: customGradient }} // Apply the custom 12-stop gradient
      />

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