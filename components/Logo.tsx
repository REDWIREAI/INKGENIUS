import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="text-center">
      <h1 className="text-3xl md:text-5xl font-bold text-orange-400 tracking-widest uppercase">
        INKGENIUS
      </h1>
      <h2 className="text-base md:text-xl font-light text-gray-300 tracking-wider uppercase">
        Tattoo & Stencil Generator
      </h2>
    </div>
  );
};

export default Logo;