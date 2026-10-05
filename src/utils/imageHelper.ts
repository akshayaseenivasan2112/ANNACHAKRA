/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DownscaledImageResult {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

/**
 * Downscale image to a maximum dimension on the long side (1024px default)
 * preserving aspect ratio. Converts output to clean JPEG data URL and base64.
 */
export async function downscaleImage(
  file: File,
  maxDimension = 1024
): Promise<DownscaledImageResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image data format'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('HTML Canvas 2D context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with 0.88 quality for optimal detail and compact size
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, 0.88);
        const base64 = dataUrl.split(',')[1] || '';

        resolve({
          base64,
          mimeType,
          dataUrl,
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
