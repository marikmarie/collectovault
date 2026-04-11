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
export default function Header({ name }: Props) {
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const firstName = name?.trim().split(' ')[0] || 'there';

  return (
    <header className="w-full px-6 pt-4 pb-2">
      <p className="text-[#d81b60] text-lg font-semibold">
        {greeting}, {firstName} 👋
      </p>
    </header>
  );
}