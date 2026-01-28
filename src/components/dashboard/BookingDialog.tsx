"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import { toast } from "sonner"
import { Loader2, CalendarIcon, Check, ChevronsUpDown, User, Search } from "lucide-react"
import { useUserContext } from "@/hooks/useUserContext"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

const bookingSchema = z.object({
    title: z.string().min(2, "العنوان مطلوب"),
    contactId: z.optional(z.string()),
    contactName: z.string().min(2, "اسم العميل مطلوب"),
    contactPhone: z.string().min(8, "رقم الهاتف مطلوب"),
    date: z.date(),
    time: z.string(), // HH:mm
    duration: z.string(), // minutes as string
    status: z.enum(["pending", "confirmed", "completed", "cancelled", "no_show"]),
    notes: z.optional(z.string()),
});




interface BookingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    booking?: any // If provided, we are editing
    defaultDate?: Date
}

export function BookingDialog({ open, onOpenChange, booking, defaultDate }: BookingDialogProps) {
    const { userId } = useUserContext()

    // Contact Search State
    const [openCombobox, setOpenCombobox] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")

    // Fetch contacts for search
    const contacts = useQuery(api.bookings.searchContacts,
        userId ? { userId, search: searchTerm, limit: 10 } : "skip"
    ) || []

    const createBooking = useMutation(api.bookings.create)
    const updateBooking = useMutation(api.bookings.update)

    const form = useForm<z.infer<typeof bookingSchema>>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            title: "",
            contactName: "",
            contactPhone: "",
            date: new Date(),
            time: "10:00",
            duration: "30",
            status: "pending",
            notes: "",
        },
    })

    // Reset/Init form
    useEffect(() => {
        if (booking) {
            const date = new Date(booking.scheduledAt)
            form.reset({
                title: booking.title,
                contactId: booking.contactId,
                contactName: booking.contactName,
                contactPhone: booking.contactPhone,
                date: date,
                time: format(date, "HH:mm"),
                duration: booking.duration.toString(),
                status: booking.status,
                notes: booking.notes || "",
            })
        } else {
            const initialDate = defaultDate ? defaultDate : new Date()
            form.reset({
                title: "",
                contactId: undefined,
                contactName: "",
                contactPhone: "",
                date: initialDate,
                time: "10:00",
                duration: "30",
                status: "pending",
                notes: "",
            })
        }
    }, [booking, defaultDate, form, open])

    const onSubmit = async (values: z.infer<typeof bookingSchema>) => {
        if (!userId) return

        try {
            // Combine date and time
            const [hours, minutes] = values.time.split(':').map(Number)
            const scheduledAt = new Date(values.date)
            scheduledAt.setHours(hours, minutes, 0, 0)

            if (booking) {
                await updateBooking({
                    userId,
                    bookingId: booking._id,
                    status: values.status,
                    scheduledAt: scheduledAt.getTime(),
                    duration: parseInt(values.duration),
                    notes: values.notes,
                })
                toast.success("تم تحديث الحجز بنجاح")
            } else {
                await createBooking({
                    userId,
                    title: values.title,
                    contactId: values.contactId as any, // Cast for ID type
                    contactName: values.contactName,
                    contactPhone: values.contactPhone,
                    scheduledAt: scheduledAt.getTime(),
                    duration: parseInt(values.duration),
                    status: values.status,
                    notes: values.notes,
                })
                toast.success("تم إنشاء الحجز بنجاح")
            }
            onOpenChange(false)
            form.reset()
        } catch (error) {
            toast.error("حدث خطأ أثناء حفظ الحجز")
            console.error(error)
        }
    }

    // Handle contact selection
    const handleSelectContact = (contactId: string) => {
        const contact = contacts.find((c: any) => c._id === contactId)
        if (contact) {
            form.setValue("contactId", contact._id)
            form.setValue("contactName", contact.name)
            form.setValue("contactPhone", contact.phone)
            setOpenCombobox(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>{booking ? "تعديل الحجز" : "حجز جديد"}</DialogTitle>
                    <DialogDescription>
                        {booking ? "تعديل بيانات الحجز الحالي" : "إضافة حجز جديد للجدول"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>عنوان الحجز</FormLabel>
                                    <FormControl>
                                        <Input placeholder="اجتماع مناقشة..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Contact Search / Details Section */}
                        <div className="bg-muted/30 p-3 rounded-lg border space-y-3">
                            <div className="flex items-center justify-between">
                                <FormLabel className="flex items-center gap-1.5 text-primary">
                                    <User className="h-4 w-4" />
                                    بيانات العميل
                                </FormLabel>

                                {!booking && (
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="sm" role="combobox" aria-expanded={openCombobox} className="h-7 text-xs gap-1">
                                                <Search className="h-3 w-3" />
                                                بحث عن عميل مسجل
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[250px]" align="end">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="بحث بالاسم أو الهاتف..."
                                                    value={searchTerm}
                                                    onValueChange={setSearchTerm}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>لم يتم العثور على نتائج</CommandEmpty>
                                                    <CommandGroup>
                                                        {contacts.map((contact: any) => (
                                                            <CommandItem
                                                                key={contact._id}
                                                                value={contact._id}
                                                                onSelect={() => handleSelectContact(contact._id)}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        form.getValues("contactId") === contact._id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span>{contact.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{contact.phone}</span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="contactName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="الاسم" {...field} className="bg-background h-8" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contactPhone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="الهاتف (05xxxxxxxx)" {...field} className="bg-background h-8 text-left" dir="ltr" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Date & Time Picker */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>التاريخ</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-right font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "d MMMM yyyy", { locale: ar })
                                                        ) : (
                                                            <span>اختر التاريخ</span>
                                                        )}
                                                        <CalendarIcon className="mr-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                    locale={ar}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الوقت</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="اختر الوقت" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="h-[200px]">
                                                {/* Generate time slots every 15 mins */}
                                                {Array.from({ length: 48 }).map((_, i) => {
                                                    const h = Math.floor(i / 2);
                                                    const m = i % 2 === 0 ? "00" : "30";
                                                    const time = `${h.toString().padStart(2, '0')}:${m}`;
                                                    return (
                                                        <SelectItem key={time} value={time}>
                                                            {time}
                                                        </SelectItem>
                                                    )
                                                })}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>المدة</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="المدة" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="15">15 دقيقة</SelectItem>
                                                <SelectItem value="30">30 دقيقة</SelectItem>
                                                <SelectItem value="45">45 دقيقة</SelectItem>
                                                <SelectItem value="60">1 ساعة</SelectItem>
                                                <SelectItem value="90">1.5 ساعة</SelectItem>
                                                <SelectItem value="120">2 ساعة</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الحالة</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="الحالة" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pending">قيد الانتظار</SelectItem>
                                                <SelectItem value="confirmed">مؤكد</SelectItem>
                                                <SelectItem value="completed">مكتمل</SelectItem>
                                                <SelectItem value="cancelled">ملغى</SelectItem>
                                                <SelectItem value="no_show">لم يحضر</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ملاحظات</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="تفاصيل إضافية..." {...field} className="min-h-[80px]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                إلغاء
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {booking ? "حفظ التغييرات" : "تأكيد الحجز"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
