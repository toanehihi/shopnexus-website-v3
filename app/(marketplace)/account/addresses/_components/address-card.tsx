"use client"

import { memo } from "react"
import { type Contact, AddressType } from "@/core/account/contact"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Pencil,
  Trash2,
  Home,
  Building2,
  Star,
  Phone,
  User,
  Navigation,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AddressCardProps {
  contact: Contact
  isDefault: boolean
  onEdit: (contact: Contact) => void
  onDelete: (contact: Contact) => void
  onSetDefault: (contactId: string) => void
  isSettingDefault: boolean
}

export const AddressCard = memo(function AddressCard({
  contact,
  isDefault,
  onEdit,
  onDelete,
  onSetDefault,
  isSettingDefault,
}: AddressCardProps) {
  const isHome = contact.address_type === AddressType.Home
  const TypeIcon = isHome ? Home : Building2

  return (
    <Card className={cn(isDefault && "border-primary")}>
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
              onClick={() => onEdit(contact)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(contact)}
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
          {contact.latitude != null && contact.longitude != null && (
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                Coordinates: {contact.latitude.toFixed(6)},{" "}
                {contact.longitude.toFixed(6)}
              </span>
            </div>
          )}
        </div>

        {!isDefault && (
          <Button
            variant="outline"
            size="sm"
            className="mt-4 w-full"
            onClick={() => onSetDefault(contact.id)}
            disabled={isSettingDefault}
          >
            <Star className="h-4 w-4 mr-1" />
            Set as Default
          </Button>
        )}
      </CardContent>
    </Card>
  )
})
