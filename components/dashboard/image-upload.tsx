'use client'

import { useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ImagePlus, X, Loader2, Upload } from 'lucide-react'

const BUCKET = 'og-images'
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  inputName?: string
}

export function ImageUpload({ value, onChange, inputName = 'og_image_url' }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only JPG, PNG, WebP or GIF allowed.')
      return
    }
    if (file.size > MAX_SIZE) {
      setError('Image must be under 5 MB.')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); return }

      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false })

      if (uploadError) { setError(uploadError.message); return }

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)
      onChange(publicUrl)
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }, [])

  function handleRemove() {
    onChange('')
    setError(null)
  }

  // Hidden input keeps the URL in the form
  return (
    <div className="space-y-2">
      <input type="hidden" name={inputName} value={value} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        /* Preview */
        <div className="relative rounded-xl overflow-hidden border bg-muted aspect-[1200/630]">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`w-full rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2 py-8 text-sm
            ${dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
            ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              <span className="text-muted-foreground">Uploading…</span>
            </>
          ) : (
            <>
              {dragOver ? (
                <Upload className="h-8 w-8 text-primary" />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <span className="font-medium text-foreground">Click to upload</span>
                <span className="text-muted-foreground"> or drag & drop</span>
              </div>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP · max 5 MB · 1200×630 recommended</span>
            </>
          )}
        </button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
