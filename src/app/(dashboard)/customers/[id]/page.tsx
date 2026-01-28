"use client"

import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import type { Id } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Phone, Mail, MessageSquare, Calendar, Clock } from "lucide-react"
import { avatarColorFromString, initialsFromName, cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { useUserContext } from "@/hooks/useUserContext"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookingDialog } from "@/components/dashboard/BookingDialog"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { CustomerDeleteDialog } from "@/components/dashboard/CustomerDeleteDialog"

export default function CustomerDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const { userId } = useUserContext()

  // Permissions
  const role = useQuery(api.permissions.getCurrentUserRole, userId ? { userId } : "skip")
  const canDelete = role === "owner" || role === "admin"

  const contact = useQuery(
    api.contacts.getById,
    id && userId ? { id: id as Id<"contacts">, userId } : "skip" // Fixed: added missing userId
  )
  const chats = useQuery(api.chat.listChats, userId ? { userId } : "skip") // Fixed: added missing userId

  const bookings = useQuery(api.bookings.listByContact,
    userId && id ? { userId, contactId: id as Id<"contacts"> } : "skip"
  ) || []
  const deleteBooking = useMutation(api.bookings.deleteBooking)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)

  const handleEdit = (booking: any) => {
    setSelectedBooking(booking)
    setIsDialogOpen(true)
  }

  const handleDelete = async (bookingId: any) => {
    if (!userId) return
    if (!confirm("هل أنت متأكد من حذف هذا الحجز؟")) return

    try {
      await deleteBooking({ userId, bookingId })
      toast.success("تم حذف الحجز")
    } catch (error) {
      toast.error("فشل حذف الحجز")
    }
  }

  const chatId = useMemo(() => {
    if (!contact || !chats) return null
    const found = chats.find((c: any) => c.contactPhone === contact.phone)
    return found ? String(found._id) : null
  }, [contact, chats])

  if (!id) return null
  if (!contact) {
    return <div className="p-8 text-center text-muted-foreground">جاري التحميل...</div>
  }

  const seed = `${contact.phone}:${contact.name}`
  const avatarBg = avatarColorFromString(seed)

  return (
    <div className="m-16 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">تفاصيل العميل</h1>
        </div>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            حذف العميل
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12 shrink-0 ring-1 ring-border/40">
              <AvatarFallback className="text-white text-sm font-semibold" style={{ backgroundColor: avatarBg }}>
                {initialsFromName(contact.name)}
              </AvatarFallback>
            </Avatar>
            <span>{contact.name}</span>
          </CardTitle>
          <CardDescription>معلومات أساسية وفتح المحادثة</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span dir="ltr">{contact.phone}</span>
          </div>
          {contact.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{contact.email}</span>
            </div>
          )}

          {contact.tags && contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((t: any) => (
                <Badge key={t} variant="outline" className="rounded-full">{t}</Badge>
              ))}
            </div>
          )}

          <div className="pt-2">
            {chatId ? (
              <Link href={`/chat/${chatId}`}>
                <Button variant="outline" className="gap-2 rounded-full">
                  <MessageSquare className="h-4 w-4" />
                  فتح المحادثة
                </Button>
              </Link>
            ) : (
              <Button variant="outline" className="gap-2 rounded-full" disabled>
                <MessageSquare className="h-4 w-4" />
                لا توجد محادثة
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            سجل الحجوزات
          </CardTitle>
          <CardDescription>الحجوزات السابقة والقادمة</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              لا توجد حجوزات مسجلة لهذا العميل.
            </div>
          ) : (
            <Table dir="rtl">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any) => (
                  <TableRow key={booking._id} className="group">
                    <TableCell className="font-medium">{booking.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{format(new Date(booking.scheduledAt), "d MMMM yyyy", { locale: ar })}</span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs">
                          <Clock className="w-3 h-3" />
                          {format(new Date(booking.scheduledAt), "HH:mm")} ({booking.duration} دقيقة)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "w-fit",
                        {
                          confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300",
                          pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300",
                          completed: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300",
                          cancelled: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300",
                          no_show: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300",
                        }[booking.status as string]
                      )}>
                        {{
                          confirmed: "مؤكد",
                          pending: "قيد الانتظار",
                          completed: "مكتمل",
                          cancelled: "ملغى",
                          no_show: "لم يحضر"
                        }[booking.status as string] || booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground" title={booking.notes}>
                      {booking.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(booking)} className="gap-2">
                            <Edit className="h-4 w-4" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(booking._id)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <BookingDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        booking={selectedBooking}
      />

      <CustomerDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        contactId={contact._id}
        contactName={contact.name}
        contactPhone={contact.phone}
      />
    </div>
  )
}
