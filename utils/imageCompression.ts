/**
 * Compresses an image file or base64 string.
 * Resizes to a maximum dimension (default 1024px) and compresses to JPEG quality 0.7.
 */
export const compressImage = (source: File | string, maxDimension = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // Fill background with white to prevent transparent PNGs from turning black
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', quality));
        };

        img.onerror = reject;

        // Load source
        if (typeof source === 'string') {
            img.src = source;
        } else {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    img.src = e.target.result as string;
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(source);
        }
    });
};
