import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you might show a more user-friendly error or disable features.
  // For this environment, we assume the key is always present.
  console.warn("API_KEY environment variable not set. App may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY as string });

// A unified helper to process an image via canvas and ensure it's a PNG.
// It can create a transparent background (default) or a solid one.
const processImageToPng = (imageUrl: string, backgroundColor?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle potential CORS issues with data URLs
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context for image processing.'));
      }
      
      // If a background color is provided, fill the canvas with it.
      // Otherwise, clear it to ensure transparency.
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      
      // Draw the original image onto the prepared canvas
      ctx.drawImage(img, 0, 0);
      
      // Resolve with the new PNG data URL
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for processing.'));
    img.src = imageUrl;
  });
};

export const removeWhiteBackground = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context.'));
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const tolerance = 20; // Allow for slight variations from pure white

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // If the pixel is close to white, make it transparent
        if (r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance) {
          data[i + 3] = 0; // Set alpha to 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for background removal.'));
    img.src = imageUrl;
  });
};


export const generateTattoo = async (
  prompt: string,
  style: string,
  referenceImage?: { base64: string; mimeType: string },
  objectImage?: { base64: string; mimeType: string },
  objectInstructions?: string
): Promise<string> => {
  const backgroundPrompt = 'a perfectly solid white background';

  if (referenceImage || objectImage) {
    // Multi-modal generation
    const parts: any[] = [];
    let fullPrompt: string;
    
    const instructionsText = objectInstructions 
      ? ` When incorporating the object, follow these specific instructions: "${objectInstructions}".`
      : '';

    if (referenceImage && objectImage) {
      parts.push({
        inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType },
      });
      parts.push({
        inlineData: { data: objectImage.base64, mimeType: objectImage.mimeType },
      });
      const objectInstructionForTwoImages = objectInstructions
        ? ` When incorporating the object from the second image, follow these specific instructions: "${objectInstructions}".`
        : '';
      fullPrompt = `Using the first image as a strong reference for the overall style and composition, create a ${style} tattoo that incorporates the object from the second image. The design should also be based on the following description: "${prompt}".${objectInstructionForTwoImages} The output must be only the generated tattoo image, isolated on ${backgroundPrompt}.`;
    } else if (referenceImage) {
      parts.push({
        inlineData: { data: referenceImage.base64, mimeType: referenceImage.mimeType },
      });
      fullPrompt = `Using the provided image as a strong reference, create a ${style} tattoo design that also incorporates the following description: "${prompt}". The output must be only the generated tattoo image, isolated on ${backgroundPrompt}.`;
    } else if (objectImage) { // This must be an else-if
      parts.push({
        inlineData: { data: objectImage.base64, mimeType: objectImage.mimeType },
      });
      fullPrompt = `Create a ${style} tattoo design of "${prompt}" that incorporates the object from the provided image.${instructionsText} The output must be only the generated tattoo image, isolated on ${backgroundPrompt}.`;
    } else {
      // This case should not be reached due to the top-level if, but as a fallback:
      throw new Error("Image provided but no logic to handle it.");
    }

    parts.push({ text: fullPrompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const { data, mimeType } = part.inlineData;
          const originalDataUrl = `data:${mimeType};base64,${data}`;
          return processImageToPng(originalDataUrl, '#FFFFFF');
        }
      }
      throw new Error("No image was generated from the provided inputs.");
    } catch (error) {
      console.error("Error generating tattoo with image inputs:", error);
      throw new Error("Failed to generate tattoo image with reference/object. Please try again.");
    }
  } else {
    // Use imagen for high-quality text-to-image generation
    const imagenBackgroundPrompt = 'a perfectly solid white background';

    const fullPrompt = `A ${style} tattoo design of "${prompt}". The tattoo should be presented as a final piece, isolated on ${imagenBackgroundPrompt}, ready for placement on skin. Focus on clean lines and high detail.`;

    try {
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        const originalDataUrl = `data:image/png;base64,${base64ImageBytes}`;
        return processImageToPng(originalDataUrl, '#FFFFFF');
      } else {
        throw new Error("No image was generated.");
      }
    } catch (error) {
      console.error("Error generating tattoo:", error);
      throw new Error("Failed to generate tattoo image. Please try again.");
    }
  }
};

export const dataUrlToBase64 = (dataUrl: string): {base64: string, mimeType: string} => {
  const [mimePart, base64Part] = dataUrl.split(';base64,');
  if (!mimePart || !base64Part) {
    throw new Error("Invalid data URL format");
  }
  const mimeType = mimePart.split(':')[1];
  return { base64: base64Part, mimeType };
};

export const adjustTattoo = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const adjustmentPrompt = `Apply the following edit to the tattoo image: "${prompt}". IMPORTANT: The final output MUST be ONLY the edited tattoo, isolated on a solid, non-transparent, perfectly white background. Do not add a transparent background or a fake checkerboard pattern. Preserve the original style unless asked otherwise.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: adjustmentPrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const { data, mimeType } = part.inlineData;
                const originalDataUrl = `data:${mimeType};base64,${data}`;
                return processImageToPng(originalDataUrl, '#FFFFFF');
            }
        }
        throw new Error("No adjusted image was generated.");
    } catch (error) {
        console.error("Error adjusting tattoo:", error);
        throw new Error("Failed to adjust the tattoo image. Please try again.");
    }
};


export const convertToStencil = async (base64Image: string, mimeType: string): Promise<string> => {
    const stencilPrompt = "Convert this image into a black and white tattoo stencil. The result must be a clean, black-only line-art style image on a solid, non-transparent, perfectly white background. It is critical that the background is solid white and not a checkerboard or any other pattern. Remove all shading and color, focusing only on the essential outlines.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: stencilPrompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const { data, mimeType } = part.inlineData;
                const originalDataUrl = `data:${mimeType};base64,${data}`;
                return processImageToPng(originalDataUrl, '#FFFFFF');
            }
        }
        throw new Error("No stencil image was generated.");
    } catch (error) {
        console.error("Error converting to stencil:", error);
        throw new Error("Failed to convert image to stencil. Please try again.");
    }
};

export const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimePart, base64Part] = result.split(';base64,');
      const mimeType = mimePart.split(':')[1];
      resolve({ base64: base64Part, mimeType });
    };
    reader.onerror = error => reject(error);
  });
};

export const getFriendlyErrorMessage = (error: any): string => {
    const defaultMessage = "An unexpected error occurred. Please try again.";
    
    if (!error) return defaultMessage;

    // Convert error to string to safely check for keywords
    const errorMessage = (error.message || String(error)).toLowerCase();

    // API & Network Errors
    if (errorMessage.includes('api_key')) {
        return "Invalid API Key. Please ensure your key is correctly configured.";
    }
    if (errorMessage.includes('quota')) {
        return "API quota exceeded. Please check your usage and billing, or try again later.";
    }
    if (errorMessage.includes('safety') || errorMessage.includes('blocked') || errorMessage.includes('moderated')) {
        return "Your request was blocked due to safety filters. Please adjust your prompt or image and try again.";
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch failed')) {
        return "A network error occurred. Please check your internet connection and try again.";
    }
    if (errorMessage.includes('internal server error') || errorMessage.includes('500')) {
        return "The AI service is currently unavailable. Please try again in a few moments.";
    }
    if (errorMessage.includes('bad request') || errorMessage.includes('400')) {
        return "The request was invalid. This can happen with unsupported image formats or prompts. Please try a different input.";
    }

    // File/Image Processing Errors (from our own service logic)
    if (errorMessage.includes('failed to load image')) {
        return "The uploaded image could not be processed. It might be corrupted or in an unsupported format.";
    }
    if (errorMessage.includes('invalid data url')) {
        return "There was an issue processing the image data. Please try uploading the image again.";
    }
    
    // Fallback to the original message if it's somewhat readable, otherwise use the generic default
    return error.message || defaultMessage;
};