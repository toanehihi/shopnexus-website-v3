"use client"

import { useEffect } from "react"
import { useGeolocation, formatAccuracy } from "@/lib/geocoding/use-geolocation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Home,
  Building2,
  Loader2,
  Phone,
  User,
  Navigation,
} from "lucide-react"
import { toast } from "sonner"

export type ContactFormData = {
  full_name: string
  phone: string
  address: string
  address_type: "Home" | "Work"
  latitude: number | null
  longitude: number | null
}

interface AddressFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isEditing: boolean
  formData: ContactFormData
  onFormDataChange: (data: ContactFormData) => void
  onSubmit: () => void
  isSubmitting: boolean
}

export function AddressFormDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: AddressFormDialogProps) {
  const {
    getLocation,
    isLoading: isLocating,
    error: geoError,
    result: geoResult,
  } = useGeolocation()

  // When geolocation result arrives, fill the form
  useEffect(() => {
    if (geoResult) {
      onFormDataChange({
        ...formData,
        address: geoResult.address,
        latitude: geoResult.latitude,
        longitude: geoResult.longitude,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoResult])

  // Show geolocation errors as toasts
  useEffect(() => {
    if (geoError) {
      toast.error(geoError)
    }
  }, [geoError])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Address" : "Add New Address"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
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
                  onFormDataChange({ ...formData, full_name: e.target.value })
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
                  onFormDataChange({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mb-2"
              onClick={getLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Locating...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-1" />
                  <Navigation className="h-4 w-4 mr-2" />
                  Use my location
                </>
              )}
            </Button>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="address"
                placeholder="Enter full address"
                className="pl-10"
                value={formData.address}
                onChange={(e) =>
                  onFormDataChange({ ...formData, address: e.target.value })
                }
              />
            </div>
            {formData.latitude != null && formData.longitude != null && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  Coordinates: {formData.latitude.toFixed(6)},{" "}
                  {formData.longitude.toFixed(6)}
                </p>
                {geoResult?.accuracy != null && (
                  <p className={`text-xs flex items-center gap-1 ${
                    formatAccuracy(geoResult.accuracy).level === 'good' ? 'text-green-600' :
                    formatAccuracy(geoResult.accuracy).level === 'ok' ? 'text-yellow-600' :
                    'text-red-500'
                  }`}>
                    Accuracy: {formatAccuracy(geoResult.accuracy).label}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_type">Address Type</Label>
            <Select
              value={formData.address_type}
              onValueChange={(value: "Home" | "Work") =>
                onFormDataChange({ ...formData, address_type: value })
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Add Address"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
