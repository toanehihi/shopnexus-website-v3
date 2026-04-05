"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Check, Loader2 } from "lucide-react"
import { useUploadFile } from "@/core/common/file"
import { useUpdateMe } from "@/core/account/account"

interface AvatarSectionProps {
  avatarUrl?: string | null
  name?: string | null
  username?: string | null
  dateCreated?: string
  emailVerified?: boolean
  phoneVerified?: boolean
}

export function AvatarSection({
  avatarUrl,
  name,
  username,
  dateCreated,
  emailVerified,
  phoneVerified,
}: AvatarSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadFile = useUploadFile()
  const updateMe = useUpdateMe()
  const isUploading = uploadFile.isPending || updateMe.isPending

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await uploadFile.mutateAsync(file)
      await updateMe.mutateAsync({ avatar_rs_id: result.id })
    } catch {
      // errors handled by mutation hooks
    }

    // reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-2xl">
                {name?.charAt(0) || username?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <Button
              size="icon"
              variant="secondary"
              className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold">
              {name || username || "User"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Member since {new Date(dateCreated || "").toLocaleDateString()}
            </p>
            <div className="flex gap-2 mt-2">
              {emailVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <Check className="h-3 w-3" />
                  Email verified
                </span>
              )}
              {phoneVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <Check className="h-3 w-3" />
                  Phone verified
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
