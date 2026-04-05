"use client"

import { useState } from "react"
import { useSignOut } from "@/core/account/auth"
import { useRouter } from "next/navigation"
import { NotificationsCard } from "./_components/notifications-card"
import { SecurityCard } from "./_components/security-card"
import { PreferencesCard } from "./_components/preferences-card"
import { DangerZoneCard } from "./_components/danger-zone-card"
import { ChangePasswordDialog } from "./_components/change-password-dialog"
import { DeleteAccountDialog } from "./_components/delete-account-dialog"

export default function SettingsPage() {
  const router = useRouter()
  const signOut = useSignOut()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    orders: true,
    promotions: false,
  })

  const handleSignOut = async () => {
    await signOut.mutateAsync()
    router.push("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <NotificationsCard
        notifications={notifications}
        onNotificationsChange={setNotifications}
      />

      <SecurityCard onChangePassword={() => setShowPasswordDialog(true)} />

      <PreferencesCard />

      <DangerZoneCard
        onSignOut={handleSignOut}
        onDeleteAccount={() => setShowDeleteDialog(true)}
      />

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />

      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  )
}
