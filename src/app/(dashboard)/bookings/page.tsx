"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useUserContext } from "@/hooks/useUserContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { BookingDialog } from "@/components/dashboard/BookingDialog"
import { BookingDetailSheet } from "@/components/dashboard/BookingDetailSheet"
import { BookingSearchDialog } from "@/components/dashboard/BookingSearchDialog"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Clock,
    MoreHorizontal,
    Trash2,
    Edit,
    ChevronLeft,
    ChevronRight,
    Search,
    Calendar as CalendarIcon,
    Filter,
    Settings,
    ChevronDown
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    format,
    isSameDay,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    addMonths,
    subMonths,
    isToday
} from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { initialsFromName, avatarColorFromString } from "@/lib/utils"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import Link from "next/link"

export default function BookingsPage() {
    const { userId } = useUserContext()
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
    const [selectedBooking, setSelectedBooking] = useState<any>(null)

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [viewingBookingId, setViewingBookingId] = useState<string | null>(null)

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Keyboard Shortcut (Cmd+K)
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setIsSearchOpen((open) => !open)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    const bookings = useQuery(api.bookings.list, userId ? { userId } : "skip") || []
    const deleteBooking = useMutation(api.bookings.deleteBooking)

    const handleDelete = async (bookingId: any) => {
        if (!userId) return
        try {
            await deleteBooking({ userId, bookingId })
            toast.success("تم حذف الحجز")
        } catch (error) {
            toast.error("فشل حذف الحجز")
        }
    }

    const handleEdit = (booking: any) => {
        setSelectedBooking(booking)
        setIsDialogOpen(true)
        setIsSheetOpen(false) // Close sheet if open
    }

    const handleView = (booking: any) => {
        setViewingBookingId(booking._id)
        setIsSheetOpen(true)
    }

    const handleNew = (date?: Date) => {
        if (date) setSelectedDate(date)
        setSelectedBooking(null)
        setIsDialogOpen(true)
    }

    // Calendar Grid Logic
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 6 }) // Saturday start for RTL/AR
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 6 })
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const jumpToday = () => {
        const now = new Date()
        setCurrentMonth(now)
        setSelectedDate(now)
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-6 sm:p-8 flex flex-col gap-8 bg-background" dir="rtl">
            {/* Header Section */}
            <div className="flex flex-col gap-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/dashboard">الرئيسية</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>الحجوزات</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">الحجوزات</h1>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => handleNew()} className="gap-2 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="h-4 w-4" />
                            حجز جديد
                        </Button>
                    </div>
                </div>


            </div>

            <Tabs defaultValue="month" className="h-full flex flex-col gap-6" onValueChange={(v) => setCurrentMonth(new Date())}>
                {/* Toolbar Section - Floating & Clean */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-2">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white dark:bg-card rounded-full shadow-sm border border-border/40 p-1">
                            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" onClick={jumpToday} className="h-8 px-4 text-xs font-medium hover:bg-muted rounded-full mx-1">
                                اليوم
                            </Button>
                            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight min-w-[140px] text-foreground">
                            {format(currentMonth, "MMMM yyyy", { locale: ar })}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 hidden sm:flex h-10 rounded-full border-border/40 bg-white/50 backdrop-blur-sm hover:bg-white text-muted-foreground shadow-sm"
                            onClick={() => setIsSearchOpen(true)}
                        >
                            <Search className="h-4 w-4" />
                            <span className="text-xs">بحث...</span>
                            <kbd className="pointer-events-none hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </Button>

                        <Link href="/bookings/settings">
                            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-border/40 bg-white/50 backdrop-blur-sm hover:bg-white text-muted-foreground shadow-sm">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </Link>

                        <div className="h-8 w-px bg-border/40 mx-1" />

                        <TabsList className="bg-white dark:bg-card p-1 rounded-full border border-border/40 shadow-sm h-10">
                            <TabsTrigger value="list" className="rounded-full px-4 text-xs h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">قائمة</TabsTrigger>
                            <TabsTrigger value="month" className="rounded-full px-4 text-xs h-8 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">شهري</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="list" className="flex-1 overflow-hidden rounded-md border">
                    <div className="h-full overflow-y-auto">
                        <Table dir="rtl">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">الحجز</TableHead>
                                    <TableHead className="text-right">العميل</TableHead>
                                    <TableHead className="text-right">التاريخ</TableHead>
                                    <TableHead className="text-right">الوقت</TableHead>
                                    <TableHead className="text-right">الحالة</TableHead>
                                    <TableHead className="text-right"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            لا توجد حجوزات
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    bookings.map((booking: any) => (
                                        <TableRow key={booking._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(booking)}>
                                            <TableCell className="font-medium">{booking.title}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback style={{ backgroundColor: avatarColorFromString(`${booking.contactPhone}:${booking.contactName}`) }} className="text-[10px] text-white">
                                                            {initialsFromName(booking.contactName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span>{booking.contactName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{format(new Date(booking.scheduledAt), "d MMMM yyyy", { locale: ar })}</TableCell>
                                            <TableCell>{format(new Date(booking.scheduledAt), "HH:mm")}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={cn(
                                                    {
                                                        confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100",
                                                        pending: "bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100",
                                                        completed: "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100",
                                                        cancelled: "bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100",
                                                        no_show: "bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100",
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
                                            <TableCell>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(booking); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="month" className="flex-1 mt-0 h-full min-h-0">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
                        {/* Main Calendar Grid - Full Width */}
                        <div className="col-span-1 lg:col-span-12 flex flex-col h-full bg-white dark:bg-card rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-border/40">
                            {/* Week Header - Minimal & Clean */}
                            <div className="grid grid-cols-7 border-b border-border/40 bg-white/50 dark:bg-muted/5 backdrop-blur-sm">
                                {["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"].map((day) => (
                                    <div key={day} className="py-4 text-center text-[13px] font-medium text-muted-foreground/80 tracking-wide">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Days Grid - Spacious & Modern */}
                            <div className="grid grid-cols-7 flex-1 min-h-0 bg-white dark:bg-card divide-x divide-x-reverse divide-y divide-border/30">
                                {calendarDays.map((day, dayIdx) => {
                                    const dayEvents = bookings.filter((b: any) => isSameDay(new Date(b.scheduledAt), day))
                                    const isCurrentMonth = isSameMonth(day, currentMonth)
                                    const isTodayDate = isToday(day)

                                    return (
                                        <div
                                            key={day.toString()}
                                            className={cn(
                                                "min-h-[120px] p-3 flex flex-col gap-2 transition-all hover:bg-muted/5 group relative",
                                                !isCurrentMonth && "bg-muted/5 text-muted-foreground/30"
                                            )}
                                            onClick={() => setSelectedDate(day)}
                                        >
                                            {/* Date Number */}
                                            <div className="flex justify-between items-start">
                                                <span className={cn(
                                                    "text-[15px] font-semibold flex items-center justify-center rounded-full w-8 h-8 transition-colors",
                                                    isTodayDate
                                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                        : "text-foreground/70 group-hover:text-foreground"
                                                )}>
                                                    {format(day, "d")}
                                                </span>
                                                {/* Quick Add Button (visible on hover) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleNew(day)
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-secondary rounded-full transition-all text-muted-foreground hover:text-foreground"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {/* Events List - Modern Pills */}
                                            <div className="flex flex-col gap-1.5 mt-1 overflow-y-auto max-h-[120px] no-scrollbar">
                                                {dayEvents.map((event: any) => {
                                                    const statusColors = {
                                                        confirmed: "bg-emerald-50 text-emerald-700 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                                                        pending: "bg-indigo-50 text-indigo-700 border-indigo-100/50 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
                                                        completed: "bg-blue-50 text-blue-700 border-blue-100/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                                                        cancelled: "bg-pink-50 text-pink-700 border-pink-100/50 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/20",
                                                        no_show: "bg-orange-50 text-orange-700 border-orange-100/50 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
                                                    }[event.status as string] || "bg-gray-50 text-gray-700"

                                                    return (
                                                        <div
                                                            key={event._id}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleView(event)
                                                            }}
                                                            className={cn(
                                                                "group/event text-[11px] px-2 py-1.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm",
                                                                statusColors
                                                            )}
                                                            title={event.title}
                                                        >
                                                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
                                                                statusColors.replace("bg-", "bg-current-").split(" ")[0].replace("50", "500")
                                                            )} />
                                                            <span className="font-semibold tabular-nums opacity-85">
                                                                {format(new Date(event.scheduledAt), "HH:mm")}
                                                            </span>
                                                            <span className="truncate font-medium flex-1">
                                                                {event.contactName || event.title}
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            <BookingDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                booking={selectedBooking}
                defaultDate={selectedDate}
            />

            <BookingDetailSheet
                bookingId={viewingBookingId}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <BookingSearchDialog
                open={isSearchOpen}
                onOpenChange={setIsSearchOpen}
                onSelectBooking={(booking) => {
                    handleView(booking)
                    // Zoom to date if needed?
                    setCurrentMonth(new Date(booking.scheduledAt))
                    setSelectedDate(new Date(booking.scheduledAt))
                }}
            />
        </div >
    )
}

