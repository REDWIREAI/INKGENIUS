import React, { useState, useRef, useEffect } from 'react';
import { convertToStencil, fileToBase64, getFriendlyErrorMessage } from '../services/geminiService';
import Spinner from './Spinner';
import ImageDisplay from './ImageDisplay';
import Tooltip from './Tooltip';

const UploadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

const StencilConverter: React.FC = () => {
    const [sourceFile, setSourceFile] = useState<File | null>(null);
    const [sourcePreview, setSourcePreview] = useState<string | null>(null);
    const [stencilImage, setStencilImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [contrast, setContrast] = useState(100);
    const [modifiedStencil, setModifiedStencil] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!stencilImage || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
            setError("Could not get canvas context for image manipulation.");
            return;
        }

        const img = new Image();
        img.src = stencilImage;

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.filter = `contrast(${contrast}%)`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            setModifiedStencil(canvas.toDataURL('image/png'));
        };

        img.onerror = () => {
            setError("Failed to load stencil image for adjustment. It might be corrupted.");
        }

    }, [stencilImage, contrast]);


    const processFile = (file: File | undefined) => {
        // Reset previous state for any new file selection
        setSourceFile(null);
        setSourcePreview(null);
        setStencilImage(null);
        setModifiedStencil(null);
        setContrast(100);
        setError(null);
        
        if (!file) {
            return;
        }
    
        const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Please upload a PNG, JPG, or WEBP file.');
            return;
        }
    
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            setError("File is too large. Please select a file under 4MB.");
            return;
        }
        
        setSourceFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSourcePreview(reader.result as string);
        };
        reader.onerror = () => {
            setError("Failed to read the file. It might be corrupted or unreadable.");
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        processFile(e.target.files?.[0]);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-orange-500');
        processFile(e.dataTransfer.files?.[0]);
    }
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('border-orange-500');
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('border-orange-500');
    }

    const handleConvert = async () => {
        if (!sourceFile || isLoading) return;

        setIsLoading(true);
        setError(null);
        setStencilImage(null);
        setModifiedStencil(null);
        setContrast(100);

        try {
            const { base64, mimeType } = await fileToBase64(sourceFile);
            const imageUrl = await convertToStencil(base64, mimeType);
            setStencilImage(imageUrl);
        } catch (err: any) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    const getFileNameWithoutExtension = (name: string) => {
        const lastDot = name.lastIndexOf('.');
        if (lastDot === -1) return name;
        return name.substring(0, lastDot);
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-xl border border-gray-700">
            <canvas ref={canvasRef} className="hidden"></canvas>
            <div 
                className="flex justify-center items-center w-full"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                <label 
                    htmlFor="dropzone-file" 
                    className="flex flex-col justify-center items-center w-full h-64 bg-gray-900 rounded-lg border-2 border-gray-600 border-dashed cursor-pointer hover:bg-gray-800 transition-colors"
                >
                    {sourcePreview ? (
                        <img src={sourcePreview} alt="Selected preview" className="h-full w-full object-contain p-2 rounded-lg" />
                    ) : (
                        <div className="flex flex-col justify-center items-center pt-5 pb-6">
                            <UploadIcon />
                            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-500">PNG, JPG, or WEBP (MAX. 4MB)</p>
                        </div>
                    )}
                    <input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange}/>
                </label>
            </div> 

            <div className="mt-4">
                <button
                    type="button"
                    onClick={handleConvert}
                    disabled={isLoading || !sourceFile}
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-black bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? (
                        <>
                            <Spinner className="w-5 h-5 mr-3" />
                            Converting...
                        </>
                    ) : (
                        'Convert to Stencil'
                    )}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-md">
                    <p>{error}</p>
                </div>
            )}

            {stencilImage && (
                 <div className="mt-4">
                     <ImageDisplay
                        imageUrl={modifiedStencil || stencilImage}
                        altText="Tattoo stencil"
                        fileName={`stencil-${getFileNameWithoutExtension(sourceFile?.name || 'converted')}.png`}
                        title="Your Converted Stencil"
                        showRemoveBackground={false}
                        downloadText="Download Stencil"
                    />
                    <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                        <div className="mb-2">
                          <Tooltip text="Increase contrast to make lines thicker and darker, removing lighter details. Decrease it to bring back finer, more delicate lines. Find the perfect balance for your stencil.">
                              <label htmlFor="contrast" className="text-sm font-medium text-orange-300">
                                  Adjust Stencil Contrast
                              </label>
                          </Tooltip>
                        </div>
                        <input
                            id="contrast"
                            type="range"
                            min="50"
                            max="250"
                            value={contrast}
                            onChange={(e) => setContrast(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                         <div className="text-center text-sm text-gray-400 mt-1">{contrast}%</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StencilConverter;