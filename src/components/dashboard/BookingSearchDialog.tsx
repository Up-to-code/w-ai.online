"use client"

import * as React from "react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useUserContext } from "@/hooks/useUserContext"
import { Calendar, User, Search } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface BookingSearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectBooking: (booking: any) => void
}

export function BookingSearchDialog({
    open,
    onOpenChange,
    onSelectBooking
}: BookingSearchDialogProps) {
    const { userId } = useUserContext()
    const router = useRouter()
    const [search, setSearch] = React.useState("")

    // We fetch a larger list or rely on backend search
    // For now, let's reuse the 'list' query and filter clientside or use searchContacts
    // ideally we'd have a specific `searchBookings` endpoint.
    // For this MVP, let's fetch contacts and bookings.

    const contacts = useQuery(api.bookings.searchContacts,
        userId ? { userId, search, limit: 5 } : "skip"
    ) || []

    const bookings = useQuery(api.bookings.list,
        userId ? { userId } : "skip"
    ) || []

    // Filter bookings client-side for now (simple MVP)
    const filteredBookings = React.useMemo(() => {
        if (!search) return []
        const term = search.toLowerCase()
        return bookings.filter((b: any) =>
            b.title.toLowerCase().includes(term) ||
            b.contactName?.toLowerCase().includes(term)
        ).slice(0, 5)
    }, [bookings, search])

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput
                placeholder="بحث عن حجز أو عميل..."
                value={search}
                onValueChange={setSearch}
            />
            <CommandList>
                <CommandEmpty>لم يتم العثور على نتائج.</CommandEmpty>

                {filteredBookings.length > 0 && (
                    <CommandGroup heading="حجوزات">
                        {filteredBookings.map((booking: any) => (
                            <CommandItem
                                key={booking._id}
                                value={`booking-${booking._id}-${booking.title}`}
                                onSelect={() => {
                                    onSelectBooking(booking)
                                    onOpenChange(false)
                                }}
                            >
                                <Calendar className="ml-2 h-4 w-4 opacity-50" />
                                <div className="flex flex-col">
                                    <span>{booking.title}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {format(new Date(booking.scheduledAt), "d MMMM - HH:mm", { locale: ar })}
                                    </span>
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {contacts.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading="عملاء">
                            {contacts.map((contact: any) => (
                                <CommandItem
                                    key={contact._id}
                                    value={`contact-${contact._id}-${contact.name}`}
                                    onSelect={() => {
                                        router.push(`/customers/${contact._id}`)
                                        onOpenChange(false)
                                    }}
                                >
                                    <User className="ml-2 h-4 w-4 opacity-50" />
                                    <div className="flex flex-col">
                                        <span>{contact.name}</span>
                                        <span className="text-xs text-muted-foreground">{contact.phone}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    )
}
