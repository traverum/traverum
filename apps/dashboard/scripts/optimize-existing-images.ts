/**
 * Script to optimize all existing images in the database
 * 
 * Usage:
 *   pnpm tsx scripts/optimize-existing-images.ts [--experience-id=<id>] [--partner-id=<id>]
 * 
 * This script will:
 * 1. Find all images in the media table
 * 2. Download each image
 * 3. Optimize it (resize + compress to WebP)
 * 4. Upload optimized version back
 * 5. Update media record with new URL
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import sharp from 'sharp';

// Load environment variables (try .env.local first, then .env)
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please set these in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface MediaRecord {
  id: string;
  storage_path: string;
  url: string;
  experience_id: string;
  partner_id: string;
  sort_order: number;
}

async function optimizeImageBuffer(
  buffer: Buffer,
  isCoverImage: boolean
): Promise<Buffer> {
  const maxWidth = isCoverImage ? 1200 : 1920;
  const maxHeight = isCoverImage ? 900 : 1080;
  const quality = isCoverImage ? 85 : 80;

  return sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
}

async function optimizeMediaRecord(media: MediaRecord, isCoverImage: boolean): Promise<void> {
  try {
    console.log(`Processing: ${media.id} (${media.storage_path})`);

    // Download original image
    const response = await fetch(media.url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const originalSize = imageBuffer.length;

    // Optimize image
    const optimizedBuffer = await optimizeImageBuffer(imageBuffer, isCoverImage);
    const optimizedSize = optimizedBuffer.length;
    const savings = ((1 - optimizedSize / originalSize) * 100).toFixed(1);

    console.log(`  Original: ${(originalSize / 1024).toFixed(1)}KB → Optimized: ${(optimizedSize / 1024).toFixed(1)}KB (${savings}% reduction)`);

    // Generate new filename with .webp extension
    const oldPath = media.storage_path;
    const pathParts = oldPath.split('/');
    const oldFileName = pathParts[pathParts.length - 1];
    const newFileName = oldFileName.replace(/\.[^/.]+$/, '') + '.webp';
    const newPath = pathParts.slice(0, -1).join('/') + '/' + newFileName;

    // Upload optimized image
    const { error: uploadError } = await supabase.storage
      .from('traverum-assets')
      .upload(newPath, optimizedBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp',
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get new public URL
    const { data: urlData } = supabase.storage
      .from('traverum-assets')
      .getPublicUrl(newPath);

    // Update media record
    const { error: updateError } = await supabase
      .from('media')
      .update({
        storage_path: newPath,
        url: urlData.publicUrl,
      })
      .eq('id', media.id);

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    // Delete old image if path changed
    if (oldPath !== newPath) {
      await supabase.storage
        .from('traverum-assets')
        .remove([oldPath]);
    }

    // Update experience cover image if this is the cover
    if (isCoverImage) {
      await supabase
        .from('experiences')
        .update({ image_url: urlData.publicUrl })
        .eq('id', media.experience_id);
    }

    console.log(`  ✓ Optimized and updated`);
  } catch (error: any) {
    console.error(`  ✗ Error: ${error.message}`);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const experienceId = args.find(arg => arg.startsWith('--experience-id='))?.split('=')[1];
  const partnerId = args.find(arg => arg.startsWith('--partner-id='))?.split('=')[1];

  console.log('Starting image optimization...\n');

  // Fetch all media records
  let query = supabase
    .from('media')
    .select('id, storage_path, url, experience_id, partner_id, sort_order')
    .eq('media_type', 'image')
    .order('experience_id')
    .order('sort_order');

  if (experienceId) {
    query = query.eq('experience_id', experienceId);
    console.log(`Filtering by experience: ${experienceId}\n`);
  } else if (partnerId) {
    query = query.eq('partner_id', partnerId);
    console.log(`Filtering by partner: ${partnerId}\n`);
  }

  const { data: allMedia, error } = await query;

  if (error) {
    console.error('Error fetching media:', error);
    process.exit(1);
  }

  if (!allMedia || allMedia.length === 0) {
    console.log('No images found to optimize.');
    return;
  }

  console.log(`Found ${allMedia.length} images to optimize\n`);

  // Group by experience to identify cover images
  const mediaByExperience = new Map<string, MediaRecord[]>();
  for (const media of allMedia) {
    if (!mediaByExperience.has(media.experience_id)) {
      mediaByExperience.set(media.experience_id, []);
    }
    mediaByExperience.get(media.experience_id)!.push(media);
  }

  let processed = 0;
  let failed = 0;

  for (const [expId, mediaList] of mediaByExperience.entries()) {
    console.log(`\nExperience: ${expId} (${mediaList.length} images)`);
    
    // Sort by sort_order to identify cover (first image)
    mediaList.sort((a, b) => a.sort_order - b.sort_order);

    for (const media of mediaList) {
      const isCoverImage = media.sort_order === 0;
      try {
        await optimizeMediaRecord(media, isCoverImage);
        processed++;
      } catch (error) {
        failed++;
        // Continue with next image
      }
    }
  }

  console.log(`\n\n=== Summary ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${allMedia.length}`);
}

main().catch(console.error);
