//Header.tsx

import React from 'react';
import { Link } from 'react-router-dom';

type HeaderProps = {
    name?: string;
    phone?: string;
    avator?: string;
};

const Header: React.FC<HeaderProps> = () => {
  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">       
        <h1 className="text-2xl font-bold">Collecto Vault</h1>
        <nav>
            <Link to="/" className="mr-4 hover:underline">Home</Link>
            <Link to="/about" className="hover:underline">About</Link>      
        </nav>
    </header>
  );
}

export default Header;