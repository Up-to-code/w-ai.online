"use client"

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Calendar,
    Clock,
    User,
    Phone,
    Mail,
    MessageSquare,
    Edit,
    Trash2,
    MapPin,
    FileText,
    ExternalLink
} from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import Link from "next/link"
import { avatarColorFromString, initialsFromName } from "@/lib/utils"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { useUserContext } from "@/hooks/useUserContext"

interface BookingDetailSheetProps {
    bookingId: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: (booking: any) => void
    onDelete: (bookingId: string) => void
}

export function BookingDetailSheet({
    bookingId,
    open,
    onOpenChange,
    onEdit,
    onDelete
}: BookingDetailSheetProps) {
    const { userId } = useUserContext()

    // Fetch full booking details including linked contact
    const bookingData = useQuery(
        api.bookings.getById,
        userId && bookingId ? { userId, bookingId: bookingId as Id<"bookings"> } : "skip"
    )

    if (!bookingId) return null

    const booking = bookingData
    const contact = bookingData?.contact

    const statusConfig = booking ? {
        pending: { label: "قيد الانتظار", color: "text-amber-600 bg-amber-50 border-amber-200" },
        confirmed: { label: "مؤكد", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
        completed: { label: "مكتمل", color: "text-blue-600 bg-blue-50 border-blue-200" },
        cancelled: { label: "ملغى", color: "text-rose-600 bg-rose-50 border-rose-200" },
        no_show: { label: "لم يحضر", color: "text-slate-600 bg-slate-50 border-slate-200" },
    }[booking.status as string] || { label: booking.status, color: "text-gray-600" } : null

    // Determine chat ID if contact exists (this would ideally typically specific query or prop)
    // For now we assume we can navigate to generic chat or find it. 
    // In a real app we might query `api.chat.findChatByContact` here.

    const avatarBg = contact ? avatarColorFromString(`${contact.phone}:${contact.name}`) : "#ccc"

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-full sm:max-w-md p-0 gap-0 overflow-y-auto">
                {!booking ? (
                    <div className="h-full flex items-center justify-center">
                        <span className="loading loading-spinner text-primary"></span>
                        <SheetTitle className="sr-only">جاري التحميل</SheetTitle>
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="p-6 bg-muted/10 border-b">
                            <div className="flex items-start justify-between mb-4">
                                <Badge variant="outline" className={`font-medium ${statusConfig?.color}`}>
                                    {statusConfig?.label}
                                </Badge>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(booking)}>
                                        <Edit className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        if (confirm("هل أنت متأكد من حذف هذا الحجز؟")) {
                                            onDelete(booking._id)
                                            onOpenChange(false)
                                        }
                                    }}>
                                        <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                                    </Button>
                                </div>
                            </div>

                            <SheetTitle className="text-xl font-bold mb-2">{booking.title}</SheetTitle>

                            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 shrink-0" />
                                    <span>
                                        {format(new Date(booking.scheduledAt), "EEEE d MMMM yyyy", { locale: ar })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 shrink-0" />
                                    <span>
                                        {format(new Date(booking.scheduledAt), "hh:mm a")} - {booking.duration} دقيقة
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Contact Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">بيانات العميل</h3>
                                <div className="bg-card border rounded-xl p-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarFallback style={{ backgroundColor: avatarBg }} className="text-white">
                                                {initialsFromName(booking.contactName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-bold">{booking.contactName}</div>
                                            <div className="text-sm text-muted-foreground" dir="ltr">{booking.contactPhone}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {contact ? (
                                            <>
                                                <Link href={`/customers/${contact._id}`} className="w-full">
                                                    <Button variant="outline" size="sm" className="w-full gap-2">
                                                        <User className="h-4 w-4" />
                                                        ملف العميل
                                                    </Button>
                                                </Link>
                                                {/* Requires chat logic to find chat ID, placeholder for now */}
                                                <Link href={`/chat?phone=${contact.phone}`} className="w-full">
                                                    <Button variant="default" size="sm" className="w-full gap-2">
                                                        <MessageSquare className="h-4 w-4" />
                                                        محادثة
                                                    </Button>
                                                </Link>
                                            </>
                                        ) : (
                                            <Button variant="secondary" size="sm" className="w-full gap-2 col-span-2" disabled>
                                                <User className="h-4 w-4" />
                                                عميل غير مسجل
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {booking.notes && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground">ملاحظات</h3>
                                    <div className="bg-muted/30 p-3 rounded-lg text-sm leading-relaxed border border-dashed">
                                        {booking.notes}
                                    </div>
                                </div>
                            )}

                            {/* Creator Info */}
                            <div className="text-xs text-muted-foreground pt-4 border-t flex justify-between">
                                <span>تم الإنشاء: {format(new Date(booking.createdAt), "d/MM/yyyy")}</span>
                                <span>آخر تحديث: {format(new Date(booking.updatedAt), "d/MM/yyyy")}</span>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
