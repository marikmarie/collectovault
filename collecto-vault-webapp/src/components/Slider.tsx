import React, { useRef, useState, useEffect } from "react";

type Slide = { key: string; node: React.ReactNode; };
type Props = { slides: Slide[]; initialIndex?: number; height?: string; };

export default function Slider({ slides, initialIndex = 0, height = "h-48" }: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) child.scrollIntoView({ behavior: "smooth", inline: "start" });
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

  return (
    <div className="relative">
      <div ref={scrollerRef} className={`w-full overflow-x-auto snap-x snap-mandatory scrollbar-hidden ${height}`} style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="flex w-full h-full">
          {slides.map(s => (
            <div key={s.key} className="w-full shrink-0 snap-start px-4">
              {s.node}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} aria-label={`Go to slide ${i + 1}`} className={`w-2.5 h-2.5 rounded-full ${i === index ? "dot-active" : "dot-inactive"}`} />
        ))}
      </div>
    </div>
  );
}
