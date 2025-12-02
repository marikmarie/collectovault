//import React from "react";

type Props = {
  title: string;
  subtitle?: string;
  img?: string;
}

export default function OfferCard({ title, subtitle, img }: Props) {
  return (
    <div className="px-4 py-4">
      <div className="card-like overflow-hidden">
        {img && <img src={img} alt={title} className="w-full h-40 object-cover"/>}
        <div className="p-4">
          <h3 className="font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
