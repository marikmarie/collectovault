// src/components/Slider.tsx
import React, { useRef, useState, useEffect } from "react";

export type Slide = { key: string; node: React.ReactNode };

export type SliderProps = {
  slides: Slide[];
  initialIndex?: number;
  height?: string;              
  itemWidth?: string; // Tailwind width class for each slide (e.g., 'w-56' or 'w-full')
  onChange?: (index: number) => void;
  className?: string;
};


export default function Slider({
  slides,
  initialIndex = 0,
  height = "h-48",
  itemWidth = "w-full",
  onChange,
  className = ""
}: SliderProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState<number>(initialIndex);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) child.scrollIntoView({ behavior: "smooth", inline: "start" });
    onChange?.(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);


  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;

    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const scrollLeft = el.scrollLeft;
        const width = el.clientWidth || 1;
        const newIndex = Math.round(scrollLeft / width);
        setIndex(newIndex);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

   const goto = (i: number) => setIndex(Math.max(0, Math.min(slides.length - 1, i)));

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollerRef}
        className={`w-full overflow-x-auto snap-x snap-mandatory scrollbar-hidden ${height}`}
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-roledescription="carousel"
      >
        <div className="flex w-full h-full items-stretch">
          {slides.map((s) => (
            <div key={s.key} className={`${itemWidth} shrink-0 snap-start px-2`}>
              {s.node}
            </div>
          ))}
        </div>
      </div>

      
      <div className="flex justify-center gap-2 mt-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goto(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-2.5 h-2.5 rounded-full ${i === index ? "dot-active" : "dot-inactive"}`}
          />
        ))}
      </div>
    </div>
  );
}
