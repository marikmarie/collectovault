import  { useState, useEffect } from "react";

type Props = {
  name: string;
  phone?: string;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Header({ name, phone }: Props) {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    // Refresh greeting every minute in case the hour rolls over
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full px-4 pt-6 pb-3">
      <div className="text-center">
        <p className="text-gray-800 text-sm tracking-wide">{greeting},</p>
        <h1 className="text-gray-900 text-2xl md:text-3xl font-semibold mt-0.5">
          {name}
        </h1>
        {phone && <p className="text-white/80 text-sm mt-1">{phone}</p>}
      </div>
    </header>
  );
}