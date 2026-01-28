"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { useUserContext } from "@/hooks/useUserContext"
import { Loader2, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface CustomerDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    contactId: Id<"contacts">
    contactName: string
    contactPhone: string
}

export function CustomerDeleteDialog({
    open,
    onOpenChange,
    contactId,
    contactName,
    contactPhone
}: CustomerDeleteDialogProps) {
    const { userId } = useUserContext()
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    // Queries for linked data
    const bookings = useQuery(api.bookings.listByContact,
        userId ? { userId, contactId } : "skip"
    )

    const orders = useQuery(api.orders.listByCustomer,
        userId ? { userId, phone: contactPhone } : "skip"
    )

    const chat = useQuery(api.chat.getContactChat,
        userId ? { userId, phone: contactPhone } : "skip"
    )

    const deleteContact = useMutation(api.contacts.deleteContact)

    // Calculating counts
    const bookingsCount = bookings?.length || 0
    const ordersCount = orders?.length || 0
    const hasChat = !!chat

    const isLoading = bookings === undefined || orders === undefined || chat === undefined

    const handleDelete = async () => {
        if (!userId) return
        setIsDeleting(true)
        try {
            await deleteContact({ userId, id: contactId })
            toast.success("تم حذف العميل بنجاح")
            router.push("/customers")
        } catch (error) {
            toast.error("حدث خطأ أثناء حذف العميل")
            console.error(error)
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        حذف العميل
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-start space-y-4">
                        <p>
                            هل أنت متأكد من رغبتك في حذف العميل <strong>{contactName}</strong>؟
                            هذا الإجراء لا يمكن التراجع عنه.
                        </p>

                        {isLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                جاري فحص البيانات المرتبطة...
                            </div>
                        ) : (
                            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm border">
                                <p className="font-medium text-foreground mb-2">البيانات المرتبطة:</p>
                                <div className="flex justify-between">
                                    <span>المحادثات:</span>
                                    <span className="font-medium">{hasChat ? "1 محادثة نشطة" : "0"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>الحجوزات:</span>
                                    <span className="font-medium">{bookingsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>الطلبات:</span>
                                    <span className="font-medium">{ordersCount}</span>
                                </div>
                            </div>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            handleDelete()
                        }}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isDeleting || isLoading}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                        حذف وتأكيد
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
