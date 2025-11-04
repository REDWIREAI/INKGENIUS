import React, { useState } from 'react';
import Header from './components/Header';
import TattooGenerator from './components/TattooGenerator';
import StencilConverter from './components/StencilConverter';
import Tabs from './components/Tabs';
import type { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('generator');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
      <p className="text-center text-gray-400 mt-4 -mb-4 text-base md:text-lg">
        Bring Your Ink Idea To Life.
      </p>
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-8">
            {activeTab === 'generator' && <TattooGenerator />}
            {activeTab === 'stencil' && <StencilConverter />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;