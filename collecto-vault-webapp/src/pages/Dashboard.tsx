// components/Slider.tsx
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";

export type Slide = { key: string; node: React.ReactNode };

export type Props = {
  slides: Slide[];
  initialIndex?: number;
  height?: string; // e.g., "h-48"
  onChange?: (i: number) => void;
};

export type SliderHandle = {
  goTo: (i: number) => void;
};

const Slider = forwardRef<SliderHandle, Props>(function Slider(
  { slides, initialIndex = 0, height = "h-48", onChange },
  ref
) {
  const [index, setIndex] = useState<number>(() => {
    // clamp
    const i = Number.isFinite(initialIndex) ? initialIndex : 0;
    return Math.max(0, Math.min(slides.length - 1, i));
  });

  // call onChange when index changes
  useEffect(() => {
    onChange?.(index);
  }, [index, onChange]);

  // expose goTo
  useImperativeHandle(ref, () => ({
    goTo(i: number) {
      const clamped = Math.max(0, Math.min(slides.length - 1, i));
      setIndex(clamped);
    }
  }), [slides.length]);

  // touch handling for swipe
  const startXRef = useRef<number | null>(null);
  const deltaXRef = useRef<number>(0);

  const onTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    deltaXRef.current = 0;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current == null) return;
    deltaXRef.current = e.touches[0].clientX - startXRef.current;
  };

  const onTouchEnd = () => {
    const dx = deltaXRef.current;
    const threshold = 40; // px
    if (dx > threshold) prev();
    else if (dx < -threshold) next();
    startXRef.current = null;
    deltaXRef.current = 0;
  };

  const prev = () => {
    setIndex((i) => Math.max(0, i - 1));
  };
  const next = () => {
    setIndex((i) => Math.min(slides.length - 1, i + 1));
  };

  // keyboard accessibility (optional)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!slides || slides.length === 0) return null;

  return (
    <div className={`w-full ${height} relative`}>
      {/* slides wrapper */}
      <div
        className="w-full h-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${index * 100}%)`, width: `${slides.length * 100}%` }}
        >
          {slides.map((s) => (
            <div key={s.key} className="min-w-full h-full shrink-0">
              <div className="w-full h-full flex items-center justify-center">
                {s.node}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prev / Next buttons */}
      <button
        aria-label="Previous"
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-1 bg-white/80 shadow-sm hidden md:inline-flex"
      >
        ‹
      </button>
      <button
        aria-label="Next"
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 bg-white/80 shadow-sm hidden md:inline-flex"
      >
        ›
      </button>

      {/* Dots */}
      <div className="absolute left-0 right-0 bottom-2 flex items-center justify-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2 h-2 rounded-full ${i === index ? "bg-gray-800" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
});

export default Slider;
