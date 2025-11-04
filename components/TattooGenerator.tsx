import React, { useState, useEffect } from 'react';
import { generateTattoo, adjustTattoo, dataUrlToBase64, fileToBase64, convertToStencil, getFriendlyErrorMessage } from '../services/geminiService';
import Spinner from './Spinner';
import ImageDisplay from './ImageDisplay';
import IconButton from './IconButton';
import Tooltip from './Tooltip';

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const RemoveIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
);

const TattooGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Realism');
  const [adjustmentPrompt, setAdjustmentPrompt] = useState('');
  const [imageHistory, setImageHistory] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [stencilImage, setStencilImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string | null>(null);
  const [objectFile, setObjectFile] = useState<File | null>(null);
  const [objectPreview, setObjectPreview] = useState<string | null>(null);
  const [objectInstructions, setObjectInstructions] = useState('');

  const [hasStoredTattoo, setHasStoredTattoo] = useState(false);

  useEffect(() => {
    const savedHistoryJSON = localStorage.getItem('tattooGenerator-imageHistory');
    if (savedHistoryJSON) {
      try {
        const savedHistory = JSON.parse(savedHistoryJSON);
        if (Array.isArray(savedHistory) && savedHistory.length > 0) {
            setHasStoredTattoo(true);
            setImageHistory(savedHistory);
            const savedIndexStr = localStorage.getItem('tattooGenerator-activeImageIndex');
            setActiveImageIndex(savedIndexStr ? parseInt(savedIndexStr, 10) : savedHistory.length - 1);
        }
      } catch(e) {
        console.error("Failed to parse image history from localStorage", e);
        localStorage.removeItem('tattooGenerator-imageHistory');
        localStorage.removeItem('tattooGenerator-activeImageIndex');
      }
    }
  }, []);

  const currentImage = activeImageIndex > -1 ? imageHistory[activeImageIndex] : null;

  const tattooStyles = [
    'Abstract', 'Anime', 'Biomechanical', 'Black & Gray', 'Blackwork', 'Chicano', 'Comic Book', 'Cyberpunk', 'Dotwork', 'Fine Line', 'Geometric', 'Gothic', 'Graffiti', 'Hyper-Realism', 'Illustrative', 'Japanese', 'Minimalist', 'Neo-Traditional', 'New School', 'Polynesian', 'Portrait', 'Realism', 'Sacred Geometry', 'Script', 'Street', 'Surrealism', 'Traditional', 'Tribal', 'Watercolor', 'Zodiac',
  ];

  const handleReferenceFileChange = (file: File | undefined) => {
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          setError("Reference file is too large. Please select a file under 4MB.");
          return;
      }
      setReferenceFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setReferencePreview(reader.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  };
  
  const handleObjectFileChange = (file: File | undefined) => {
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
          setError("Object file is too large. Please select a file under 4MB.");
          return;
      }
      setObjectFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setObjectPreview(reader.result as string);
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const createDragHandlers = (fileHandler: (file: File | undefined) => void) => ({
    handleDrop: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-orange-500'); fileHandler(e.dataTransfer.files?.[0]); },
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-orange-500'); },
    handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-orange-500'); }
  });

  const referenceDragHandlers = createDragHandlers(handleReferenceFileChange);
  const objectDragHandlers = createDragHandlers(handleObjectFileChange);
  
  const clearReferenceImage = () => {
    setReferenceFile(null); setReferencePreview(null);
    const input = document.getElementById('reference-file-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  const clearObjectImage = () => {
    setObjectFile(null); setObjectPreview(null); setObjectInstructions('');
    const input = document.getElementById('object-file-input') as HTMLInputElement;
    if (input) input.value = '';
  };

  const handleLoadPreviousTattoo = () => {
    const savedHistoryJSON = localStorage.getItem('tattooGenerator-imageHistory');
    const savedIndexStr = localStorage.getItem('tattooGenerator-activeImageIndex');
    const savedPrompt = localStorage.getItem('tattooGenerator-latestPrompt');
    const savedStyle = localStorage.getItem('tattooGenerator-latestStyle');
    
    if (savedHistoryJSON) {
        const savedHistory = JSON.parse(savedHistoryJSON);
        const savedIndex = savedIndexStr ? parseInt(savedIndexStr, 10) : -1;

        if (Array.isArray(savedHistory) && savedHistory.length > 0) {
            setImageHistory(savedHistory);
            setActiveImageIndex(savedIndex > -1 ? savedIndex : savedHistory.length - 1);
            if (savedPrompt) setPrompt(savedPrompt);
            if (savedStyle) setStyle(savedStyle);
            setStencilImage(null);
        }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt || isLoading || isAdjusting) return;

    setIsLoading(true);
    setError(null);
    
    // On a new generation from the form, clear the stencil.
    if (e) { 
      setStencilImage(null);
    }

    try {
      let referenceImageData = referenceFile ? await fileToBase64(referenceFile) : undefined;
      let objectImageData = objectFile ? await fileToBase64(objectFile) : undefined;
      
      const imageUrl = await generateTattoo(prompt, style, referenceImageData, objectImageData, objectInstructions);

      const historyToBranchFrom = imageHistory.slice(0, activeImageIndex + 1);
      const newHistory = [...historyToBranchFrom, imageUrl];
      setImageHistory(newHistory);
      setActiveImageIndex(newHistory.length - 1);

      localStorage.setItem('tattooGenerator-imageHistory', JSON.stringify(newHistory));
      localStorage.setItem('tattooGenerator-activeImageIndex', String(newHistory.length - 1));
      localStorage.setItem('tattooGenerator-latestPrompt', prompt);
      localStorage.setItem('tattooGenerator-latestStyle', style);
      setHasStoredTattoo(true);
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentPrompt || !currentImage || isLoading || isAdjusting) return;

    setIsAdjusting(true);
    setError(null);

    try {
      const { base64, mimeType } = dataUrlToBase64(currentImage);
      const imageUrl = await adjustTattoo(base64, mimeType, adjustmentPrompt);
      
      const historyToBranchFrom = imageHistory.slice(0, activeImageIndex + 1);
      const newHistory = [...historyToBranchFrom, imageUrl];
      setImageHistory(newHistory);
      setActiveImageIndex(newHistory.length - 1);

      localStorage.setItem('tattooGenerator-imageHistory', JSON.stringify(newHistory));
      localStorage.setItem('tattooGenerator-activeImageIndex', String(newHistory.length - 1));

      setAdjustmentPrompt('');
    } catch (err: any) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setIsAdjusting(false);
    }
  };
  
  const handleConvertToStencil = async () => {
    if (!currentImage || isLoading || isAdjusting || isConverting) return;

    setIsConverting(true); setError(null);
    try {
        const { base64, mimeType } = dataUrlToBase64(currentImage);
        const imageUrl = await convertToStencil(base64, mimeType);
        setStencilImage(imageUrl);
    } catch (err: any) {
        setError(getFriendlyErrorMessage(err));
    } finally {
        setIsConverting(false);
    }
  };

  const handleUndo = () => {
    if (activeImageIndex > 0) {
        const newIndex = activeImageIndex - 1;
        setActiveImageIndex(newIndex);
        localStorage.setItem('tattooGenerator-activeImageIndex', String(newIndex));
    }
  };

  const handleHistoryItemClick = (index: number) => {
      setActiveImageIndex(index);
      localStorage.setItem('tattooGenerator-activeImageIndex', String(index));
  };
  
  const handleClearHistory = () => {
      setImageHistory([]);
      setActiveImageIndex(-1);
      localStorage.removeItem('tattooGenerator-imageHistory');
      localStorage.removeItem('tattooGenerator-activeImageIndex');
      setHasStoredTattoo(false);
      // Also clear main display
      setStencilImage(null);
  };

  const examplePrompts = [ "A fierce dragon coiled around a samurai sword, japanese style", "A delicate hummingbird sipping nectar from a vibrant hibiscus flower, watercolor style", "An intricate geometric mandala with a lotus at its center", "A wolf howling at a full moon in a mystical forest scene" ];
  
  const handleExampleClick = (example: string) => setPrompt(example);

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl border border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-lg font-medium text-orange-300">
              1. Describe Your Tattoo Idea
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-2 block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-white p-3 transition"
              placeholder="e.g., A majestic lion with a crown of stars"
            />
          </div>

          <div className="text-xs text-gray-400">
              <p className="font-semibold">Need inspiration? Try one of these prompts:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                  {examplePrompts.map(p => (
                      <button type="button" key={p} onClick={() => handleExampleClick(p)} className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2.5 py-1.5 rounded-full transition-colors">
                          {p.substring(0, 50)}...
                      </button>
                  ))}
              </div>
          </div>
          
          <div>
            <label htmlFor="style-select" className="block text-lg font-medium text-orange-300">
              2. Choose Your Style
            </label>
            <select
                id="style-select"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-2 block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-white p-3 transition"
            >
                {tattooStyles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <Tooltip text="Upload an image of a specific object (like a flower, a symbol, or a pet) that you want the AI to include in the final tattoo design.">
              <label className="text-lg font-medium text-orange-300">
                3. Add an Object Image (Optional)
              </label>
            </Tooltip>
            <p className="text-sm text-gray-400 mt-1 mb-2">Upload an image of an object to incorporate into your design.</p>
            <div 
                className="flex justify-center items-center w-full"
                {...objectDragHandlers}
            >
              {objectPreview ? (
                <div className="w-full">
                  <div className="relative w-full h-48">
                    <img src={objectPreview} alt="Object preview" className="h-full w-full object-contain p-2 rounded-lg bg-gray-900 border-2 border-gray-600"/>
                    <button type="button" onClick={clearObjectImage} className="absolute top-2 right-2 text-black bg-white/50 rounded-full hover:bg-white/80 transition-colors">
                        <RemoveIcon className="w-6 h-6" />
                    </button>
                  </div>
                   <div className="mt-2">
                      <Tooltip text="Provide clear instructions on how to use the object image. For example: 'Place the flower in the lion's mane' or 'Make the symbol the centerpiece of the design'.">
                        <label htmlFor="object-instructions" className="text-sm font-medium text-orange-400">
                            Instructions for the object
                        </label>
                      </Tooltip>
                      <textarea id="object-instructions" rows={2} value={objectInstructions} onChange={(e) => setObjectInstructions(e.target.value)} className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-white p-2 transition" placeholder="e.g., place it on the lion's head, make it small and subtle..." />
                  </div>
                </div>
              ) : (
                <label htmlFor="object-file-input" className="flex flex-col justify-center items-center w-full h-48 bg-gray-900 rounded-lg border-2 border-gray-600 border-dashed cursor-pointer hover:bg-gray-800 transition-colors">
                    <div className="flex flex-col justify-center items-center pt-5 pb-6">
                        <UploadIcon />
                        <p className="mt-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-gray-500">PNG or JPG (MAX. 4MB)</p>
                    </div>
                    <input id="object-file-input" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleObjectFileChange(e.target.files?.[0])}/>
                </label>
              )}
            </div>
          </div>

          <div>
              <Tooltip text="Upload an existing tattoo or artwork. The AI will use this image as a strong inspiration for the style, color palette, and overall composition of your new design.">
                <label className="text-lg font-medium text-orange-300">
                  4. Add a Reference Image (Optional)
                </label>
              </Tooltip>
              <p className="text-sm text-gray-400 mt-1 mb-2">Upload an image to guide the AI's style and composition.</p>
              <div 
                  className="flex justify-center items-center w-full"
                  {...referenceDragHandlers}
              >
                {referencePreview ? (
                  <div className="relative w-full h-48">
                    <img src={referencePreview} alt="Reference preview" className="h-full w-full object-contain p-2 rounded-lg bg-gray-900 border-2 border-gray-600"/>
                    <button type="button" onClick={clearReferenceImage} className="absolute top-2 right-2 text-black bg-white/50 rounded-full hover:bg-white/80 transition-colors">
                        <RemoveIcon className="w-6 h-6" />
                    </button>
                  </div>
                ) : (
                  <label htmlFor="reference-file-input" className="flex flex-col justify-center items-center w-full h-48 bg-gray-900 rounded-lg border-2 border-gray-600 border-dashed cursor-pointer hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col justify-center items-center pt-5 pb-6">
                          <UploadIcon />
                          <p className="mt-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-500">PNG, JPG, or WEBP (MAX. 4MB)</p>
                      </div>
                      <input id="reference-file-input" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleReferenceFileChange(e.target.files?.[0])}/>
                  </label>
                )}
              </div> 
          </div>

        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={isLoading || isAdjusting || !prompt}
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading && !currentImage ? <><Spinner className="w-5 h-5 mr-3" />Generating...</> : 'Generate Tattoo'}
          </button>
          {hasStoredTattoo && !currentImage && (
            <button
              type="button"
              onClick={handleLoadPreviousTattoo}
              className="w-full inline-flex items-center justify-center px-6 py-3 border border-orange-500 text-base font-medium rounded-md text-orange-400 bg-transparent hover:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 transition-colors"
            >
                Load Previous Session
            </button>
        )}
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {(isLoading && !currentImage) && (
        <div className="flex justify-center items-center mt-6 p-4">
          <Spinner className="w-10 h-10" />
        </div>
      )}

      {currentImage && (
         <ImageDisplay
            imageUrl={currentImage}
            altText={prompt}
            fileName={`tattoo-${prompt.slice(0, 20).replace(/\s+/g, '_')}.png`}
            title="Your Generated Tattoo"
            onRegenerate={() => handleSubmit()}
            isRegenerating={isLoading && activeImageIndex === imageHistory.length - 1}
            onConvertToStencil={handleConvertToStencil}
            isConverting={isConverting}
            stencilImageUrl={stencilImage}
            stencilFileName={`stencil-${prompt.slice(0, 20).replace(/\s+/g, '_')}.png`}
            onAdjust={handleAdjust}
            adjustmentPrompt={adjustmentPrompt}
            onAdjustmentPromptChange={setAdjustmentPrompt}
            isAdjusting={isAdjusting}
            onUndo={handleUndo}
            canUndo={activeImageIndex > 0}
            key={currentImage}
        />
      )}

      {imageHistory.length > 0 && (
        <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-orange-400">Generation History</h3>
                <button onClick={handleClearHistory} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Clear History</button>
            </div>
            <div className="overflow-x-auto pb-2">
                <div className="flex space-x-4">
                    {imageHistory.map((img, index) => (
                        <div key={index} className="relative flex-shrink-0 w-32 h-32 cursor-pointer group" onClick={() => handleHistoryItemClick(index)}>
                            <img 
                                src={img} 
                                alt={`History item ${index + 1}`} 
                                className={`w-full h-full object-cover rounded-md transition-all ${activeImageIndex === index ? 'ring-2 ring-orange-500' : 'ring-1 ring-gray-600 group-hover:ring-orange-400'}`}
                            />
                             <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${activeImageIndex === index ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                               <span className="text-white font-bold text-lg">View</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TattooGenerator;