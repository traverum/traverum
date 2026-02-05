import { useState, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableImage } from './SortableImage';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface MediaItem {
  id: string;
  url: string;
  storage_path: string;
  sort_order: number;
}

interface ImageUploaderProps {
  partnerId: string;
  experienceId: string | null; // null for new experiences
  images: MediaItem[];
  onImagesChange: (images: MediaItem[]) => void;
  maxImages?: number;
}

export function ImageUploader({
  partnerId,
  experienceId,
  images,
  onImagesChange,
  maxImages = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        sort_order: index,
      }));
      onImagesChange(newImages);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Maximum images reached',
        description: `You can only upload up to ${maxImages} images.`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    const invalidFiles = filesToUpload.filter(f => !validTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload only JPG, PNG, or WebP images.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024;
    const oversizedFiles = filesToUpload.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: 'Each image must be under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const newImages: MediaItem[] = [];
      const tempExpId = experienceId || 'temp-' + Date.now();

      for (const file of filesToUpload) {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const storagePath = `partners/${partnerId}/experiences/${tempExpId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('traverum-assets')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: 'Upload failed',
            description: uploadError.message,
            variant: 'destructive',
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('traverum-assets')
          .getPublicUrl(storagePath);

        const newImage: MediaItem = {
          id: crypto.randomUUID(),
          url: urlData.publicUrl,
          storage_path: storagePath,
          sort_order: images.length + newImages.length,
        };

        newImages.push(newImage);
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: 'Images uploaded',
          description: `${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded successfully.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload images.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    const imageToDelete = images.find(img => img.id === imageId);
    if (!imageToDelete) return;

    try {
      // Delete from storage
      const { error } = await supabase.storage
        .from('traverum-assets')
        .remove([imageToDelete.storage_path]);

      if (error) {
        console.error('Delete error:', error);
      }

      // Update local state
      const newImages = images
        .filter(img => img.id !== imageId)
        .map((img, index) => ({
          ...img,
          sort_order: index,
        }));
      onImagesChange(newImages);

      toast({
        title: 'Image deleted',
      });
    } catch (error: any) {
      toast({
        title: 'Delete failed',
        description: error.message || 'Failed to delete image.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {images.length === 0 ? (
        <div 
          className="border-2 border-dashed border-muted rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <p className="text-sm text-muted-foreground mb-1">No images yet</p>
          <p className="text-xs text-muted-foreground">Click to upload JPG, PNG, or WebP (max 5MB each)</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  isCover={index === 0}
                  onDelete={() => handleDeleteImage(image.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
