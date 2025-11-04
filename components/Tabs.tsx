import React from 'react';
import type { Tab } from '../types';

interface TabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: Tab; label: string }[] = [
    { id: 'generator', label: 'Tattoo Generator' },
    { id: 'stencil', label: 'Stencil Converter' },
  ];

  return (
    <div className="flex justify-center bg-gray-800 rounded-lg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-colors duration-200
            ${
              activeTab === tab.id
                ? 'bg-orange-600 text-black shadow-lg'
                : 'text-gray-300 bg-gray-700 hover:bg-gray-600'
            }
            focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;