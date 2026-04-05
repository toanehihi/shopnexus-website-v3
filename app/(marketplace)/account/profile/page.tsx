"use client"

import { useState } from "react"
import { useGetMe, useUpdateMe } from "@/core/account/account"
import { ProfileSkeleton } from "./_components/profile-skeleton"
import { AvatarSection } from "./_components/avatar-section"
import { PersonalInfoCard } from "./_components/personal-info-card"
import { AccountStatusCard } from "./_components/account-status-card"

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

      <AvatarSection
        avatarUrl={user?.avatar_url}
        name={user?.name}
        username={user?.username}
        dateCreated={user?.date_created}
        emailVerified={user?.email_verified}
        phoneVerified={user?.phone_verified}
      />

      <PersonalInfoCard
        isEditing={isEditing}
        formData={formData}
        onFormDataChange={setFormData}
        onEdit={handleEdit}
        onCancel={() => setIsEditing(false)}
        onSave={handleSave}
        isSaving={updateMe.isPending}
        user={user}
      />

      <AccountStatusCard status={user?.status} />
    </div>
  )
}
