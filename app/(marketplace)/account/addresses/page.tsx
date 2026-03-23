"use client"

import { useState } from "react"
import {
  useListContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  AddressType,
  type Contact,
} from "@/core/account/contact"
import { useGetMe, useUpdateMe } from "@/core/account/account"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Home,
  Building2,
  Loader2,
  Star,
  Phone,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type ContactFormData = {
  full_name: string
  phone: string
  address: string
  address_type: "Home" | "Work"
}

const emptyForm: ContactFormData = {
  full_name: "",
  phone: "",
  address: "",
  address_type: "Home",
}

export default function AddressesPage() {
  const { data: contacts, isLoading } = useListContacts()
  const { data: user } = useGetMe()
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const updateMe = useUpdateMe()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null)
  const [formData, setFormData] = useState<ContactFormData>(emptyForm)

  const openAddDialog = () => {
    setEditingContact(null)
    setFormData(emptyForm)
    setIsDialogOpen(true)
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      full_name: contact.full_name,
      phone: contact.phone,
      address: contact.address,
      address_type: contact.address_type === AddressType.Home ? "Home" : "Work",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.phone || !formData.address) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      if (editingContact) {
        await updateContact.mutateAsync({
          contact_id: editingContact.id,
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          address_type: formData.address_type,
        })
        toast.success("Address updated successfully")
      } else {
        await createContact.mutateAsync(formData)
        toast.success("Address added successfully")
      }
      setIsDialogOpen(false)
    } catch (error) {
      toast.error(
        editingContact ? "Failed to update address" : "Failed to add address"
      )
      console.error(error)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await deleteContact.mutateAsync({ contact_id: deleteConfirm.id })
      toast.success("Address deleted successfully")
      setDeleteConfirm(null)
    } catch (error) {
      toast.error("Failed to delete address")
      console.error(error)
    }
  }

  const handleSetDefault = async (contactId: string) => {
    try {
      await updateMe.mutateAsync({ default_contact_id: contactId })
      toast.success("Default address updated")
    } catch (error) {
      toast.error("Failed to set default address")
      console.error(error)
    }
  }

  const isSubmitting = createContact.isPending || updateContact.isPending

  if (isLoading) {
    return <AddressesSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Addresses</h1>
          <p className="text-muted-foreground">
            Manage your delivery addresses
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Address
        </Button>
      </div>

      {!contacts || contacts.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-muted mb-6">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No addresses yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Add a delivery address to make checkout faster.
          </p>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((contact) => {
            const isDefault = user?.default_contact_id === contact.id
            const isHome = contact.address_type === AddressType.Home
            const TypeIcon = isHome ? Home : Building2

            return (
              <Card
                key={contact.id}
                className={cn(isDefault && "border-primary")}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {isHome ? "Home" : "Work"}
                      </Badge>
                      {isDefault && (
                        <Badge className="gap-1">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm(contact)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="font-medium">{contact.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{contact.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">
                        {contact.address}
                      </span>
                    </div>
                  </div>

                  {!isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => handleSetDefault(contact.id)}
                      disabled={updateMe.isPending}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set as Default
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {editingContact
                ? "Update your delivery address details."
                : "Add a new delivery address to your account."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="full_name"
                  placeholder="Enter full name"
                  className="pl-10"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  className="pl-10"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="address"
                  placeholder="Enter full address"
                  className="pl-10"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_type">Address Type</Label>
              <Select
                value={formData.address_type}
                onValueChange={(value: "Home" | "Work") =>
                  setFormData({ ...formData, address_type: value })
                }
              >
                <SelectTrigger id="address_type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Home
                    </div>
                  </SelectItem>
                  <SelectItem value="Work">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Work
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingContact ? (
                "Save Changes"
              ) : (
                "Add Address"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          {deleteConfirm && (
            <div className="rounded-lg border p-4 space-y-1">
              <p className="font-medium">{deleteConfirm.full_name}</p>
              <p className="text-sm text-muted-foreground">
                {deleteConfirm.address}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteContact.isPending}
            >
              {deleteContact.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AddressesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
