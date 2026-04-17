"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Check, Upload, Video, X, Loader2 } from "lucide-react"
import { useListStyles } from "@/core/catalog/video-product"

const ACCEPTED_TYPES = ["video/mp4", "video/webm", "video/quicktime"]
const MAX_SIZE_MB = 50

interface VideoUploadStepProps {
  onProcess: (file: File, style: string) => void
  isPending: boolean
}

export function VideoUploadStep({ onProcess, isPending }: VideoUploadStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [style, setStyle] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: styles, isLoading: stylesLoading } = useListStyles()

  const handleFileSelect = (selected: File | null) => {
    setError(null)
    if (!selected) {
      setFile(null)
      setPreviewUrl(null)
      return
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Unsupported format. Use MP4, WebM, or MOV.")
      return
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Maximum ${MAX_SIZE_MB}MB.`)
      return
    }
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  const handleClear = () => {
    setFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
          <CardDescription>
            Record a video describing your product. We will extract the audio, transcribe it, and generate a product description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm font-medium">Drop your video here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV up to {MAX_SIZE_MB}MB</p>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video src={previewUrl!} controls className="w-full max-h-[300px] mx-auto" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleClear}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4" />
                <span>{file.name}</span>
                <span>({(file.size / (1024 * 1024)).toFixed(1)}MB)</span>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description Style</CardTitle>
          <CardDescription>Choose the tone for the generated product description</CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="sr-only">Style</Label>
          <Select value={style} onValueChange={setStyle} disabled={stylesLoading}>
            <SelectTrigger>
              <SelectValue placeholder={stylesLoading ? "Loading styles..." : "Select a style"} />
            </SelectTrigger>
            <SelectContent>
              {styles?.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isPending ? (
        <ProgressSteps />
      ) : (
        <Button
          className="w-full"
          size="lg"
          disabled={!file || !style}
          onClick={() => file && style && onProcess(file, style)}
        >
          Process Video
        </Button>
      )}
    </div>
  )
}

const PROGRESS_STAGES = [
  "Uploading video...",
  "Extracting audio...",
  "Denoising audio...",
  "Transcribing speech...",
  "Generating description...",
  "Classifying category...",
]

function ProgressSteps() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev < PROGRESS_STAGES.length - 1 ? prev + 1 : prev))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {PROGRESS_STAGES.map((label, i) => (
          <div key={label} className="flex items-center gap-3 text-sm">
            {i < activeIndex ? (
              <Check className="h-4 w-4 text-primary" />
            ) : i === activeIndex ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />
            )}
            <span className={i <= activeIndex ? "text-foreground" : "text-muted-foreground"}>
              {label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
