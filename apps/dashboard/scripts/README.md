# Image Optimization Scripts

## Overview

This directory contains scripts for optimizing images in the Traverum platform.

## Optimize Existing Images

The `optimize-existing-images.ts` script processes all existing images in the database, optimizing them for web performance.

### Features

- Resizes images to optimal dimensions:
  - Cover images: 1200×900px (4:3 aspect ratio)
  - Gallery images: up to 1920×1080px (16:9 or 4:3)
- Converts all images to WebP format
- Compresses images to target file sizes (400KB for covers, 600KB for galleries)
- Updates database records with new URLs
- Deletes old image files after successful optimization

### Prerequisites

1. Set up environment variables in `.env.local`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Usage

```bash
# Optimize all images in the database
pnpm optimize-images

# Optimize images for a specific experience
pnpm optimize-images -- --experience-id=<uuid>

# Optimize images for a specific partner
pnpm optimize-images -- --partner-id=<uuid>
```

### What It Does

1. Fetches all image records from the `media` table
2. Downloads each original image
3. Optimizes the image (resize + compress + convert to WebP)
4. Uploads the optimized version to Supabase Storage
5. Updates the `media` record with the new URL and storage path
6. Updates the experience's `image_url` if it's a cover image
7. Deletes the old image file

### Output

The script provides detailed progress information:
- Original file size vs optimized file size
- Percentage reduction
- Success/failure status for each image
- Final summary with total processed and failed counts

### Notes

- The script processes images sequentially to avoid overwhelming the server
- Failed images are logged but don't stop the process
- Old images are only deleted after successful upload and database update
- Cover images (sort_order = 0) are optimized to 1200×900px
- Gallery images are optimized to up to 1920×1080px

## Automatic Optimization for New Uploads

New image uploads are automatically optimized in the dashboard using the `ImageUploader` component. Images are:
- Automatically resized to optimal dimensions
- Converted to WebP format
- Compressed before upload

No manual action required for new uploads!
