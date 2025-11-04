import React from 'react';
import Logo from './Logo';

const Header: React.FC = () => (
  <header className="bg-gray-900/50 backdrop-blur-sm border-b border-orange-500/30 sticky top-0 z-10">
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-center">
        <Logo />
      </div>
    </div>
  </header>
);

export default Header;