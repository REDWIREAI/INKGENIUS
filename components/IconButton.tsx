import React from 'react';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  text: string;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, text, className, ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-black bg-orange-600 border border-transparent rounded-md shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default IconButton;
