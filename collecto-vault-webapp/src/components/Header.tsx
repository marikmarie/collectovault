//import React from "react";

type Props = {
  name: string;
  phone?: string;
  avatar?: string;
}

export default function Header({ name, phone, avatar }: Props) {
  return (
    <div className="hero-header text-white">
      <div className="px-4 pt-6 pb-6">
        <div className="flex items-start justify-between">
          <button className="p-2">
            <span className="sr-only">menu</span>
            <svg width="24" height="24" fill="white"><path d="M3 6h18M3 12h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div className="avatar-ring mx-auto -mt-6">
            <img src={avatar} alt="avatar" className="w-full h-full object-cover"/>
          </div>
          <div className="p-2" />
        </div>

        <div className="text-center mt-2">
          <h1 className="text-2xl font-semibold">{name}</h1>
          {phone && <p className="text-sm opacity-80 mt-1">{phone}</p>}
          <p className="text-xs opacity-75 mt-2">My Statement</p>
        </div>
      </div>
    </div>
  );
}
