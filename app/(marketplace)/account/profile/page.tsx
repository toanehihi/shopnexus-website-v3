"use client"

import { useState } from "react"
import { useGetMe, useUpdateMe } from "@/core/account/account"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Camera, Loader2, Mail, Phone, User, Calendar, Check } from "lucide-react"

export default function ProfilePage() {
  const { data: user, isLoading } = useGetMe()
  const updateMe = useUpdateMe()

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    gender: "",
    date_of_birth: "",
  })

  const handleEdit = () => {
    setFormData({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      phone: user?.phone || "",
      gender: user?.gender?.toString() || "",
      date_of_birth: user?.date_of_birth || "",
    })
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      await updateMe.mutateAsync({
        name: formData.name || null,
        username: formData.username || null,
        gender: formData.gender as "Male" | "Female" | "Other" | undefined,
        date_of_birth: formData.date_of_birth || null,
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
    }
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar_url ?? undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {user?.name || user?.username || "User"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(user?.date_created || "").toLocaleDateString()}
              </p>
              <div className="flex gap-2 mt-2">
                {user?.email_verified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <Check className="h-3 w-3" />
                    Email verified
                  </span>
                )}
                {user?.phone_verified && (
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

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={handleEdit}>
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateMe.isPending}>
                  {updateMe.isPending ? (
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              ) : (
                <p className="text-sm py-2">{user?.name || "—"}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              {isEditing ? (
                <Input
                  id="username"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              ) : (
                <p className="text-sm py-2">{user?.username || "—"}</p>
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
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
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
                  {user?.gender !== null ? ["Male", "Female", "Other"][user?.gender ?? 0] : "—"}
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
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  />
                </div>
              ) : (
                <p className="text-sm py-2">
                  {user?.date_of_birth
                    ? new Date(user.date_of_birth).toLocaleDateString()
                    : "—"}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
          <CardDescription>Your account status and type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <p className="text-sm font-medium mt-1">
                <span className="inline-flex items-center gap-1 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  {user?.status || "Active"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
