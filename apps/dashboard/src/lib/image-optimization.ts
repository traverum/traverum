import imageCompression from 'browser-image-compression';

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  useWebWorker?: boolean;
}

/**
 * Optimizes an image file for web use
 * - Resizes to max dimensions (maintains aspect ratio)
 * - Converts to WebP format
 * - Compresses to target file size
 */
export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxSizeMB = 0.5, // 500KB target
    useWebWorker = true,
  } = options;

  // Determine if this is a cover image (first image) or gallery image
  // Cover images: 4:3 aspect ratio, Gallery: 16:9 or 4:3
  const isCoverImage = maxWidth === 1200 && maxHeight === 900;

  const compressionOptions = {
    maxSizeMB,
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker,
    fileType: 'image/webp', // Always convert to WebP
    initialQuality: isCoverImage ? 0.85 : 0.80, // Slightly higher quality for covers
    alwaysKeepResolution: false,
  };

  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    
    // Ensure we have a .webp extension
    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
    return new File([compressedFile], fileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image optimization error:', error);
    // Fallback: return original file if optimization fails
    return file;
  }
}

/**
 * Optimize cover image (4:3 aspect ratio, 1200x900px)
 */
export async function optimizeCoverImage(file: File): Promise<File> {
  return optimizeImage(file, {
    maxWidth: 1200,
    maxHeight: 900,
    maxSizeMB: 0.4, // 400KB target for covers
  });
}

/**
 * Optimize gallery image (16:9 or 4:3, up to 1920x1080px)
 */
export async function optimizeGalleryImage(file: File): Promise<File> {
  return optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    maxSizeMB: 0.6, // 600KB target for galleries
  });
}
