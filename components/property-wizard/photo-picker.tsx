'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'

export function PhotoPicker({
  photos,
  onChange,
}: {
  photos: File[]
  onChange: (files: File[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    onChange([...photos, ...Array.from(fileList)])
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {previews.map((url, i) => (
          <div
            key={url}
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-muted"
          >
            <img src={url} alt={`Foto ${i + 1}`} className="size-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label="Quitar foto"
              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-foreground/70 text-background"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
        >
          <ImagePlus className="size-5" />
          <span className="text-[0.65rem] font-medium">Agregar</span>
        </button>
      </div>
    </div>
  )
}
