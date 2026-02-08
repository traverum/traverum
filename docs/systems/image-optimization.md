Updated by Auto on 27-01-2026

# Image Optimization System

## What & Why

**WHAT:** Automatic image compression and optimization for experience photos uploaded by suppliers.

**WHY:** Fast widget loading while maintaining premium visual quality. All images converted to WebP format for optimal compression.

## Settings

**Cover Images (Hero/First Image):**
- Quality: 0.90 (premium)
- Dimensions: 1200×900px (4:3 aspect ratio)
- Max file size: 500KB
- Format: WebP

**Gallery Images (Additional Photos):**
- Quality: 0.85 (high)
- Dimensions: 1920×1080px (16:9 or 4:3)
- Max file size: 700KB
- Format: WebP

## How It Works

1. User uploads image → `ImageUploader` component
2. Image optimized client-side via `browser-image-compression` library
3. Resized to max dimensions (maintains aspect ratio)
4. Compressed to target quality level
5. Converted to WebP format
6. Uploaded to Supabase Storage (`traverum-assets` bucket)
7. URL stored in `media` table

## Implementation

**File:** `apps/dashboard/src/lib/image-optimization.ts`

**Functions:**
- `optimizeCoverImage(file)` - Cover image optimization
- `optimizeGalleryImage(file)` - Gallery image optimization
- `optimizeImage(file, options)` - Base optimization function

**Library:** `browser-image-compression` (uses Web Workers for non-blocking compression)

## Quality Levels

- **0.90** = Premium quality (minimal visual loss, ~80% file size reduction)
- **0.85** = High quality (good balance, ~85% file size reduction)
- **0.80** = Good quality (acceptable compression, ~88% file size reduction)

Quality parameter controls compression ratio, not file size percentage. Higher quality = better visual fidelity, larger files.

## Performance

- WebP format: 30-40% smaller than JPEG at same quality
- Client-side compression: No server load
- Web Workers: Non-blocking UI during compression
- Lazy loading: Gallery images load on demand in widget

## Future Enhancements

- Server-side re-optimization script for existing images
- Responsive image variants (different sizes for mobile/desktop)
- AVIF format support (better compression than WebP)
