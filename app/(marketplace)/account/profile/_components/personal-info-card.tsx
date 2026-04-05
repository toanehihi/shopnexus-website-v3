"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Mail, Phone, User, Calendar } from "lucide-react"

interface PersonalInfoFormData {
  name: string
  username: string
  email: string
  phone: string
  gender: string
  date_of_birth: string
}

interface PersonalInfoCardProps {
  isEditing: boolean
  formData: PersonalInfoFormData
  onFormDataChange: (data: PersonalInfoFormData) => void
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  isSaving: boolean
  user: {
    name?: string | null
    username?: string | null
    email?: string | null
    phone?: string | null
    gender?: number | null
    date_of_birth?: string | null
  } | null | undefined
}

export function PersonalInfoCard({
  isEditing,
  formData,
  onFormDataChange,
  onEdit,
  onCancel,
  onSave,
  isSaving,
  user,
}: PersonalInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </div>
          {!isEditing ? (
            <Button variant="outline" onClick={onEdit}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={onSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  placeholder="Enter your name"
                  className="pl-10"
                  value={formData.name}
                  onChange={(e) => onFormDataChange({ ...formData, name: e.target.value })}
                />
              </div>
            ) : (
              <p className="text-sm py-2">{user?.name || "\u2014"}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            {isEditing ? (
              <Input
                id="username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => onFormDataChange({ ...formData, username: e.target.value })}
              />
            ) : (
              <p className="text-sm py-2">{user?.username || "\u2014"}</p>
            )}
          </div>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                className="pl-10"
                value={user?.email || ""}
                disabled
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Contact support to change your email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                className="pl-10"
                value={user?.phone || ""}
                disabled
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            {isEditing ? (
              <Select
                value={formData.gender}
                onValueChange={(value) => onFormDataChange({ ...formData, gender: value })}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm py-2">
                {user?.gender !== null ? ["Male", "Female", "Other"][user?.gender ?? 0] : "\u2014"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            {isEditing ? (
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dob"
                  type="date"
                  className="pl-10"
                  value={formData.date_of_birth}
                  onChange={(e) => onFormDataChange({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
            ) : (
              <p className="text-sm py-2">
                {user?.date_of_birth
                  ? new Date(user.date_of_birth).toLocaleDateString()
                  : "\u2014"}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
