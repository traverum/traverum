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
import { optimizeCoverImage, optimizeGalleryImage } from '@/lib/image-optimization';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [imageToDeleteId, setImageToDeleteId] = useState<string | null>(null);
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

    // Note: File size validation removed - optimization will handle large files
    setUploading(true);

    try {
      const newImages: MediaItem[] = [];
      const tempExpId = experienceId || 'temp-' + Date.now();

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        try {
          // Determine if this is a cover image (first image overall)
          const isCoverImage = images.length === 0 && i === 0;
          
          // Optimize image before upload
          const optimizedFile = isCoverImage
            ? await optimizeCoverImage(file)
            : await optimizeGalleryImage(file);
          
          // Generate filename with .webp extension
          const fileName = `${crypto.randomUUID()}.webp`;
          const storagePath = `partners/${partnerId}/experiences/${tempExpId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('traverum-assets')
            .upload(storagePath, optimizedFile, {
              cacheControl: '3600',
              upsert: false,
              contentType: 'image/webp',
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
        } catch (error: any) {
          console.error('Error processing image:', error);
          toast({
            title: 'Image processing failed',
            description: error.message || 'Failed to process image.',
            variant: 'destructive',
          });
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: 'Images uploaded',
          description: `${newImages.length} image${newImages.length > 1 ? 's' : ''} uploaded and optimized successfully.`,
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

    setImageToDeleteId(null);

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

  const confirmDeleteImage = () => {
    if (imageToDeleteId) handleDeleteImage(imageToDeleteId);
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
          <p className="text-xs text-muted-foreground">Click to upload JPG, PNG, or WebP</p>
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
                  onDelete={() => setImageToDeleteId(image.id)}
                />
              ))}
              {images.length < maxImages && (
                <div
                  className="relative aspect-square border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <div className="animate-spin w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full" />
                  ) : (
                    <>
                      <span className="text-xl text-muted-foreground leading-none">+</span>
                      <span className="text-[10px] text-muted-foreground mt-1">Bild</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AlertDialog open={!!imageToDeleteId} onOpenChange={(open) => !open && setImageToDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the image from this experience. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteImage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
