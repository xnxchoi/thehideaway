'use server';

import { revalidateTag, unstable_cache } from 'next/cache';
import fs from 'node:fs/promises';
import path from 'path';
import { randomNumber } from './randomNumber';

const imageDir = path.join(process.cwd(), 'public', 'assets', 'media');

// This function will be cached
const getCachedImageFiles = unstable_cache(
  async () => {
    try {
      const files = await fs.readdir(imageDir);
      const imageFiles = files.filter(file =>
        /\.(webp|jpg|jpeg|png)$/i.test(file),
      );

      // Deduplicate images based on the base name
      const imageMap = new Map<string, string>();
      for (const file of imageFiles) {
        const baseName = file.split('-')[0];
        if (baseName && !imageMap.has(baseName)) {
          imageMap.set(baseName, file);
        }
      }

      return Array.from(imageMap.values());
    } catch (error) {
      console.error('Failed to read image directory:', error);
      return [];
    }
  },
  ['fallback-images'], // Cache key parts
  {
    tags: ['fallback-images'], // Tag for on-demand revalidation
    revalidate: 3600, // Revalidate every hour
  },
);

export async function getFallbackImage(): Promise<string> {
  const imageFiles = await getCachedImageFiles();

  if (imageFiles.length === 0) {
    // Return a default placeholder or an empty string if no images are found
    return '/assets/media/placeholder.png'; // Make sure you have a placeholder image
  }

  const randomIndex = randomNumber(0, imageFiles.length - 1);
  const randomImage = imageFiles[randomIndex];

  if (!randomImage) {
    return '/assets/media/placeholder.png';
  }

  return path.join('/assets/media', randomImage);
}

// Optional: Function to manually revalidate the cache
export async function revalidateFallbackImages() {
  revalidateTag('fallback-images');
}
