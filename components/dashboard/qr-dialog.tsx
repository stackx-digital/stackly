'use client'

import { useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, QrCode } from 'lucide-react'

interface QRDialogProps {
  url: string
  slug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QRDialog({ url, slug, open, onOpenChange }: QRDialogProps) {
  const canvasRef = useRef<HTMLDivElement>(null)

  function handleDownload() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qr-${slug}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code
          </DialogTitle>
          <DialogDescription className="break-all text-xs">{url}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-2">
          <div ref={canvasRef} className="rounded-lg border p-4 bg-white">
            <QRCodeCanvas
              value={url}
              size={220}
              level="M"
              marginSize={1}
            />
          </div>
          <Button onClick={handleDownload} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
