'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Button } from './Button';

interface ImageItem {
  url: string;
}

interface ImageUploaderProps {
  value: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  max?: number;
  kind?: 'product' | 'category' | 'banner';
  disabled?: boolean;
}

export function ImageUploader({
  value = [],
  onChange,
  max = 8,
  kind = 'product',
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const availableSlots = max - value.length;
    if (availableSlots <= 0) {
      setError(`Maximum of ${max} image${max > 1 ? 's' : ''} allowed`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setUploading(true);

    try {
      const newImages: ImageItem[] = [];

      for (const file of filesToUpload) {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 5 MB`);
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await apiFetch<{ url: string; thumbUrl: string }>(
          `/api/v1/admin/uploads?kind=${kind}`,
          {
            method: 'POST',
            body: formData,
          },
        );

        newImages.push({ url: res.url });
      }

      onChange([...value, ...newImages]);
    } catch (err: any) {
      setError(err?.message || 'Failed to upload image(s)');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleMove = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= value.length) return;
    const itemA = value[index];
    const itemB = value[targetIndex];
    if (!itemA || !itemB) return;
    const updated = [...value];
    updated[index] = itemB;
    updated[targetIndex] = itemA;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Grid of uploaded images */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {value.map((item, index) => (
          <div
            key={item.url + index}
            className="group relative aspect-square rounded-xl overflow-hidden border border-border/80 bg-white flex items-center justify-center shadow-2xs"
          >
            <Image
              src={item.url}
              alt={`Image ${index + 1}`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 50vw, 25vw"
            />

            {/* Primary tag */}
            {index === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold bg-accent text-accent-fg rounded-md shadow-sm">
                Primary
              </span>
            )}

            {/* Actions overlay */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                {index > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMove(index, 'prev')}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    title="Move left"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  className="h-8 w-8 p-0 text-danger-fg hover:bg-danger/20"
                  title="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {index < value.length - 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMove(index, 'next')}
                    className="h-8 w-8 p-0 text-white hover:bg-white/20"
                    title="Move right"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Upload Drop/Click Area */}
        {value.length < max && !disabled && (
          <label
            className={`aspect-square rounded-xl border border-dashed border-border hover:border-accent hover:bg-surface-2 cursor-pointer flex flex-col items-center justify-center p-3 text-center transition-colors ${
              uploading ? 'pointer-events-none opacity-60' : ''
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              multiple={max > 1}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={disabled || uploading}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-1.5 text-muted-fg text-xs">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span>Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-muted-fg text-xs">
                <div className="p-2.5 rounded-full bg-surface-2 border border-border text-foreground">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <span className="font-medium text-foreground">
                  {value.length === 0 ? 'Upload image' : 'Add more'}
                </span>
                <span className="text-[11px] text-muted-fg">Max 5 MB each</span>
              </div>
            )}
          </label>
        )}
      </div>

      {error && <p className="text-xs text-danger-fg">{error}</p>}
    </div>
  );
}
