"use client"

import { useRef } from "react"
import dynamic from "next/dynamic"
import type { RichTextEditorRef } from "@/components/ui/rich-text-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

const RichTextEditor = dynamic(
  () => import("@/components/ui/rich-text-editor").then((mod) => mod.RichTextEditor),
  { ssr: false, loading: () => <div className="h-[200px] rounded-md border border-input bg-muted/50 animate-pulse" /> }
)

interface VideoReviewStepProps {
  transcription: string
  description: string
  onDescriptionChange: (html: string) => void
  onBack: () => void
  onNext: () => void
}

export function VideoReviewStep({
  transcription,
  description,
  onDescriptionChange,
  onBack,
  onNext,
}: VideoReviewStepProps) {
  const editorRef = useRef<RichTextEditorRef>(null)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
          <CardDescription>This is what we heard from your video</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap">
            {transcription}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Description</CardTitle>
          <CardDescription>Edit the description below before continuing</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            ref={editorRef}
            defaultValue={description}
            onChange={(html) => onDescriptionChange(html)}
            placeholder="Product description..."
            toolbarOptions="full"
            className="[&_.ql-editor]:min-h-[200px]"
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext}>
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
