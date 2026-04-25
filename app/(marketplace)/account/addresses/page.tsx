"use client"
export const dynamic = "force-dynamic"

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
import { MapPin, Plus } from "lucide-react"
import { toast } from "sonner"
import { AddressesSkeleton } from "./_components/addresses-skeleton"
import { AddressCard } from "./_components/address-card"
import { AddressFormDialog, type ContactFormData } from "./_components/address-form-dialog"
import { DeleteConfirmDialog } from "./_components/delete-confirm-dialog"
import {
  isAddressCountryMismatch,
  parseAddressCountryMismatch,
} from "@/lib/queryclient/response.type"
import { countryLabel } from "@/lib/countries"

const emptyForm: ContactFormData = {
  full_name: "",
  phone: "",
  address: "",
  address_type: "Home",
  latitude: null,
  longitude: null,
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
  const [addressError, setAddressError] = useState<string | null>(null)

  const handleFormDataChange = (next: ContactFormData) => {
    // Clear the server address error as soon as the user edits the field,
    // so they can retry without the stale message lingering.
    if (addressError && next.address !== formData.address) {
      setAddressError(null)
    }
    setFormData(next)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) setAddressError(null)
    setIsDialogOpen(open)
  }

  const openAddDialog = () => {
    setEditingContact(null)
    setFormData(emptyForm)
    setAddressError(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (contact: Contact) => {
    setEditingContact(contact)
    setFormData({
      full_name: contact.full_name,
      phone: contact.phone,
      address: contact.address,
      address_type: contact.address_type === AddressType.Home ? "Home" : "Work",
      latitude: contact.latitude ?? null,
      longitude: contact.longitude ?? null,
    })
    setAddressError(null)
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
          latitude: formData.latitude,
          longitude: formData.longitude,
        })
        toast.success("Address updated successfully")
      } else {
        await createContact.mutateAsync({
          full_name: formData.full_name,
          phone: formData.phone,
          address: formData.address,
          address_type: formData.address_type,
          latitude: formData.latitude,
          longitude: formData.longitude,
        })
        toast.success("Address added successfully")
      }
      setIsDialogOpen(false)
      setAddressError(null)
    } catch (error) {
      if (isAddressCountryMismatch(error)) {
        const parsed = parseAddressCountryMismatch(error)
        const profile = parsed?.profileCountry
        const resolved = parsed?.resolvedCountry
        const profileText = profile
          ? `${countryLabel(profile)} (${profile})`
          : "your profile country"
        const resolvedText = resolved
          ? ` — it appears to be in ${countryLabel(resolved)} (${resolved})`
          : ""
        setAddressError(
          `This address is not in ${profileText}${resolvedText}. Enter an address in your country, or change your country in profile settings.`,
        )
        return
      }
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
          {contacts.map((contact) => (
            <AddressCard
              key={contact.id}
              contact={contact}
              isDefault={user?.default_contact_id === contact.id}
              onEdit={openEditDialog}
              onDelete={setDeleteConfirm}
              onSetDefault={handleSetDefault}
              isSettingDefault={updateMe.isPending}
            />
          ))}
        </div>
      )}

      <AddressFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogOpenChange}
        isEditing={!!editingContact}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        addressError={addressError}
      />

      <DeleteConfirmDialog
        contact={deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
        onDelete={handleDelete}
        isDeleting={deleteContact.isPending}
      />
    </div>
  )
}
