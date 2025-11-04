import React, { useState } from 'react';
import { useImageDownloader } from '../hooks/useImageDownloader';
import { removeWhiteBackground } from '../services/geminiService';
import IconButton from './IconButton';
import Spinner from './Spinner';
import TryOn from './TryOn';

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const RegenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const UndoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H13a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);

const CameraIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

const MagicWandIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3.102 6.273a1 1 0 011.08-.293l1.265.633a1 1 0 001.31-.353l.363-.627a1 1 0 011.638-.352l.363.627a1 1 0 001.31.353l1.265-.633a1 1 0 11.787 1.836l-1.265.633a1 1 0 00-.353 1.31l.627.363a1 1 0 01.352 1.638l-.627.363a1 1 0 00-.353 1.31l1.265.633a1 1 0 11-.787 1.836l-1.265-.633a1 1 0 00-1.31.353l-.363.627a1 1 0 01-1.638.352l-.363-.627a1 1 0 00-1.31-.353l-1.265.633a1 1 0 11-.787-1.836l1.265-.633a1 1 0 00.353-1.31l-.627-.363a1 1 0 01-.352-1.638l.627-.363a1 1 0 00.353-1.31L3.102 8.109a1 1 0 01-.293-1.08 1 1 0 011.08-.293l.293.146.293-.147a1 1 0 011.08.293zM10.198 1.42a1 1 0 011.604 0l1.265 2.192a1 1 0 001.246.59l2.458-.819a1 1 0 011.23,1.23l-.819,2.458a1 1 0 00.59,1.246l2.192,1.265a1 1 0 010,1.604l-2.192,1.265a1 1 0 00-.59,1.246l.819,2.458a1 1 0 01-1.23,1.23l-2.458-.819a1 1 0 00-1.246.59L11.802,18.58a1 1 0 01-1.604,0l-1.265-2.192a1 1 0 00-1.246-.59l-2.458.819a1 1 0 01-1.23-1.23l.819-2.458a1 1 0 00-.59-1.246L3.42,11.802a1 1 0 010-1.604l2.192-1.265a1 1 0 00.59-1.246L5.383,5.23a1 1 0 011.23-1.23l2.458.819a1 1 0 001.246-.59L10.198,1.42z" />
    </svg>
);


interface ImageDisplayProps {
  imageUrl: string;
  altText: string;
  fileName: string;
  title?: string;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  onConvertToStencil?: () => void;
  isConverting?: boolean;
  stencilImageUrl?: string | null;
  stencilFileName?: string;
  onAdjust?: (e: React.FormEvent) => void;
  adjustmentPrompt?: string;
  onAdjustmentPromptChange?: (value: string) => void;
  isAdjusting?: boolean;
  onUndo?: () => void;
  canUndo?: boolean;
  imageContainerClassName?: string;
  showRemoveBackground?: boolean;
  downloadText?: string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ 
    imageUrl, 
    altText, 
    fileName, 
    title,
    onRegenerate, 
    isRegenerating,
    onConvertToStencil,
    isConverting,
    stencilImageUrl,
    stencilFileName,
    onAdjust,
    adjustmentPrompt,
    onAdjustmentPromptChange,
    isAdjusting,
    onUndo,
    canUndo,
    imageContainerClassName = 'bg-gray-900',
    showRemoveBackground = true,
    downloadText,
}) => {
  const { downloadImage } = useImageDownloader();
  const [tryOnImage, setTryOnImage] = useState<string | null>(null);
  const [transparentTattoo, setTransparentTattoo] = useState<string | null>(null);
  const [transparentStencil, setTransparentStencil] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgRemovalError, setBgRemovalError] = useState<string | null>(null);

  if (!imageUrl) return null;

  const handleRemoveTattooBg = async () => {
      if (isRemovingBg) return;

      if (transparentTattoo) {
          setTransparentTattoo(null);
          return;
      }

      setIsRemovingBg(true);
      setBgRemovalError(null);
      try {
          const transparentUrl = await removeWhiteBackground(imageUrl);
          setTransparentTattoo(transparentUrl);
      } catch (error) {
          console.error(error);
          setBgRemovalError("Failed to remove background. Please try again.");
      } finally {
          setIsRemovingBg(false);
      }
  };
  
  const handleRemoveStencilBg = async () => {
      if (isRemovingBg || !stencilImageUrl) return;
      
      if (transparentStencil) {
          setTransparentStencil(null);
          return;
      }

      setIsRemovingBg(true);
      setBgRemovalError(null);
      try {
          const transparentUrl = await removeWhiteBackground(stencilImageUrl);
          setTransparentStencil(transparentUrl);
      } catch (error) {
          console.error(error);
          setBgRemovalError("Failed to remove stencil background. Please try again.");
      } finally {
          setIsRemovingBg(false);
      }
  };

  const handleTryOn = async () => {
    if (isRemovingBg) return;
    if (transparentTattoo) {
        setTryOnImage(transparentTattoo);
        return;
    }
    
    setIsRemovingBg(true);
    setBgRemovalError(null);
    try {
        const transparentUrl = await removeWhiteBackground(imageUrl);
        setTransparentTattoo(transparentUrl); // Cache for future use
        setTryOnImage(transparentUrl);
    } catch (error) {
        console.error("Failed to prepare image for Try On:", error);
        setBgRemovalError("Could not prepare image for Try On. Please try again.");
    } finally {
        setIsRemovingBg(false);
    }
  };
  
  const handleStencilTryOn = async () => {
    if (isRemovingBg || !stencilImageUrl) return;
    if (transparentStencil) {
        setTryOnImage(transparentStencil);
        return;
    }

    setIsRemovingBg(true);
    setBgRemovalError(null);
    try {
        const transparentUrl = await removeWhiteBackground(stencilImageUrl);
        setTransparentStencil(transparentUrl); // Cache for future use
        setTryOnImage(transparentUrl);
    } catch (error) {
        console.error("Failed to prepare stencil for Try On:", error);
        setBgRemovalError("Could not prepare stencil for Try On. Please try again.");
    } finally {
        setIsRemovingBg(false);
    }
  };

  const currentTattooUrl = transparentTattoo || imageUrl;
  const currentStencilUrl = transparentStencil || stencilImageUrl;
  const finalImageContainerClassName = transparentTattoo ? 'bg-transparent' : imageContainerClassName;

  return (
    <>
      <div className="mt-6 p-4 bg-gray-800 rounded-lg shadow-inner">
          {title && <h3 className="text-lg font-semibold text-orange-400 mb-3">{title}</h3>}
          <div 
              className={`relative rounded-lg overflow-hidden ${finalImageContainerClassName}`}
          >
              <img 
                  src={currentTattooUrl} 
                  alt={altText} 
                  className="w-full object-contain transition-all duration-300" 
                  style={{ filter: isRegenerating ? 'blur(4px) brightness(0.6)' : 'none' }}
              />
              
              {isRegenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30">
                      <Spinner className="w-10 h-10" />
                      <p className="text-white mt-2 font-semibold">Generating...</p>
                  </div>
              )}
          </div>
          
          {!isRegenerating && (
              <div className="mt-4 flex items-center justify-center flex-wrap gap-4">
                  <IconButton 
                      icon={<DownloadIcon />} 
                      text={downloadText || "Download Tattoo"}
                      onClick={() => downloadImage(currentTattooUrl, fileName)}
                  />
                  {showRemoveBackground && (
                    <IconButton
                        icon={isRemovingBg ? <Spinner className="w-5 h-5"/> : <MagicWandIcon />}
                        text={isRemovingBg ? 'Processing...' : (transparentTattoo ? 'Restore Background' : 'Remove Background')}
                        onClick={handleRemoveTattooBg}
                        disabled={isRemovingBg}
                    />
                  )}
                  <IconButton
                      icon={isRemovingBg ? <Spinner className="w-5 h-5"/> : <CameraIcon />}
                      text={isRemovingBg ? 'Preparing...' : 'Try On'}
                      onClick={handleTryOn}
                      disabled={isRemovingBg}
                      className="inline-flex"
                  />
                  {onRegenerate && (
                      <IconButton 
                          icon={<RegenerateIcon />} 
                          text="Regenerate"
                          onClick={onRegenerate}
                      />
                  )}
              </div>
          )}

          {bgRemovalError && (
              <p className="text-center text-red-400 text-sm mt-2">{bgRemovalError}</p>
          )}

          {onAdjust && !isRegenerating && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                  <form onSubmit={onAdjust}>
                      <label htmlFor="adjustment-prompt" className="block text-lg font-medium text-orange-300">
                          Fine-Tune Your Design
                      </label>
                      <p className="text-sm text-gray-400 mb-2">Describe any changes you'd like to make to the generated image.</p>
                      <textarea
                        id="adjustment-prompt"
                        rows={2}
                        value={adjustmentPrompt}
                        onChange={(e) => onAdjustmentPromptChange?.(e.target.value)}
                        className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-white p-3 transition"
                        placeholder="e.g., Make the dragon red, add a moon in the background..."
                      />
                      <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <button
                          type="submit"
                          disabled={isAdjusting || isRegenerating || !adjustmentPrompt}
                          className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isAdjusting ? (
                            <>
                              <Spinner className="w-5 h-5 mr-3" />
                              Adjusting...
                            </>
                          ) : (
                            'Adjust Tattoo'
                          )}
                        </button>
                        {onUndo && (
                          <button
                            type="button"
                            onClick={onUndo}
                            disabled={!canUndo || isAdjusting || isRegenerating}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-orange-500 text-base font-medium rounded-md text-orange-400 bg-transparent hover:bg-orange-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <UndoIcon />
                            Undo Last Adjustment
                          </button>
                        )}
                      </div>
                  </form>
              </div>
          )}

          {onConvertToStencil && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                  {!stencilImageUrl ? (
                      <div className="text-center">
                          <button
                              type="button"
                              onClick={onConvertToStencil}
                              disabled={isConverting}
                              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              {isConverting ? (
                                  <>
                                      <Spinner className="w-5 h-5 mr-3" />
                                      Converting...
                                  </>
                              ) : (
                                  'Convert to Stencil'
                              )}
                          </button>
                      </div>
                  ) : stencilFileName && currentStencilUrl && (
                      <div>
                          <h3 className="text-lg font-semibold text-orange-400 mb-3">Your Converted Stencil</h3>
                          <img 
                              src={currentStencilUrl} 
                              alt={`${altText} stencil`} 
                              className={`rounded-lg w-full object-contain p-2 transition-colors ${!transparentStencil ? 'bg-white' : 'bg-transparent'}`} 
                          />
                          <div className="mt-3 flex items-center justify-center flex-wrap gap-4">
                              <IconButton 
                                  icon={<DownloadIcon />} 
                                  text="Download Stencil"
                                  onClick={() => downloadImage(currentStencilUrl, stencilFileName)}
                              />
                              <IconButton
                                  icon={isRemovingBg ? <Spinner className="w-5 h-5"/> : <MagicWandIcon />}
                                  text={isRemovingBg ? 'Processing...' : (transparentStencil ? 'Restore Background' : 'Remove Background')}
                                  onClick={handleRemoveStencilBg}
                                  disabled={isRemovingBg}
                              />
                              <IconButton
                                  icon={isRemovingBg ? <Spinner className="w-5 h-5"/> : <CameraIcon />}
                                  text={isRemovingBg ? 'Preparing...' : 'Try Stencil On'}
                                  onClick={handleStencilTryOn}
                                  disabled={isRemovingBg}
                                  className="inline-flex"
                              />
                          </div>
                      </div>
                  )}
              </div>
          )}
      </div>
      {tryOnImage && <TryOn imageUrl={tryOnImage} onClose={() => setTryOnImage(null)} />}
    </>
  );
};

export default ImageDisplay;