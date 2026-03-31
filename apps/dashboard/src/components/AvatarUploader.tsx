import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSupportToastOptionsSonner } from '@/lib/support';
import { optimizeAvatarImage } from '@/lib/image-optimization';
import { Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvatarUploaderProps {
  partnerId: string;
  currentUrl: string | null;
  onUploaded: (url: string | null) => void;
}

export function AvatarUploader({ partnerId, currentUrl, onUploaded }: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image', getSupportToastOptionsSonner());
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20 MB', getSupportToastOptionsSonner());
      return;
    }

    setUploading(true);
    try {
      const optimizedFile = await optimizeAvatarImage(file);
      const storagePath = `partners/${partnerId}/avatar.webp`;

      const { error: uploadError } = await supabase.storage
        .from('traverum-assets')
        .upload(storagePath, optimizedFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/webp',
        });

      if (uploadError) {
        toast.error(uploadError.message, getSupportToastOptionsSonner());
        return;
      }

      const { data: urlData } = supabase.storage
        .from('traverum-assets')
        .getPublicUrl(storagePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      onUploaded(publicUrl);
      toast.success('Avatar uploaded');
    } catch {
      toast.error('Failed to upload avatar', getSupportToastOptionsSonner());
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onUploaded(null);
    toast.success('Avatar removed');
  };

  return (
    <div className="flex items-center gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div
        className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border border-border cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        {currentUrl ? (
          <img src={currentUrl} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Camera className="h-6 w-6" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-5 w-5 text-white" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : currentUrl ? 'Change photo' : 'Upload photo'}
        </Button>
        {currentUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
