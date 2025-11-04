import { useCallback } from 'react';

export const useImageDownloader = () => {
  const downloadImage = useCallback(async (imageUrl: string, fileName: string) => {
    if (!imageUrl) return;

    try {
      // Use the modern Fetch API to convert the data URL to a Blob.
      // This is the most reliable and simplest method in modern browsers.
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      // Create a temporary URL for the Blob
      const blobUrl = URL.createObjectURL(blob);

      // Create a link element, set its properties, and trigger the download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Revoke the object URL after the download is initiated to free up memory
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      alert("An error occurred while trying to download the image. Please try again.");
    }
  }, []);

  return { downloadImage };
};
