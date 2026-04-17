"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, Check, Plus, X } from "lucide-react"
import type { Classification } from "@/core/catalog/video-product"

interface VideoClassifyStepProps {
  classifications: Classification[]
  selectedCategoryName: string
  onCategorySelect: (categoryName: string) => void
  tags: string[]
  onTagsChange: (tags: string[]) => void
  onBack: () => void
  onNext: () => void
}

export function VideoClassifyStep({
  classifications,
  selectedCategoryName,
  onCategorySelect,
  tags,
  onTagsChange,
  onBack,
  onNext,
}: VideoClassifyStepProps) {
  const [tagInput, setTagInput] = useState("")

  const topScore = classifications[0]?.score ?? 1

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
    }
    setTagInput("")
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category</CardTitle>
          <CardDescription>Select the best matching category for your product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {classifications.map((c, i) => {
            const isSelected = selectedCategoryName === c.category_name
            const widthPercent = Math.max(10, (c.score / topScore) * 100)
            return (
              <button
                key={c.category_name}
                type="button"
                onClick={() => onCategorySelect(c.category_name)}
                className={`w-full text-left rounded-lg border p-3 transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={i < 3 ? "default" : "secondary"} className="text-xs">
                      #{i + 1}
                    </Badge>
                    <span className="font-medium text-sm">{c.display_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {(c.score * 100).toFixed(1)}%
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isSelected ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Add tags to help customers find your product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <Button type="button" variant="outline" size="icon" onClick={addTag}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => onTagsChange(tags.filter((t) => t !== tag))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedCategoryName}>
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
