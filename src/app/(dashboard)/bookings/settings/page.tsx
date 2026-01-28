"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useUserContext } from "@/hooks/useUserContext"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Clock, Video, Shield, Bell, ArrowRight } from "lucide-react"
import Link from "next/link"

const DAYS = [
    { value: 0, label: "الأحد" },
    { value: 1, label: "الإثنين" },
    { value: 2, label: "الثلاثاء" },
    { value: 3, label: "الأربعاء" },
    { value: 4, label: "الخميس" },
    { value: 5, label: "الجمعة" },
    { value: 6, label: "السبت" },
]

export default function BookingSettingsPage() {
    const { userId } = useUserContext()
    const config = useQuery(api.bookings.getBookingConfig, userId ? { userId } : "skip")
    const updateConfig = useMutation(api.bookings.updateBookingConfig)

    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        availability: {
            businessHours: { start: "09:00", end: "17:00" },
            workingDays: [0, 1, 2, 3, 4],
            timezone: "Asia/Riyadh",
            slotDuration: 30,
            bufferTime: 10,
        },
        meeting: {
            defaultLocation: "phone",
            zoomLink: "",
            meetLink: "",
            customLocation: "",
        },
        permissions: {
            allowAgentsToEdit: true,
            allowAgentsToDelete: false,
            requireApproval: false,
        },
        notifications: {
            sendReminders: true,
            reminderHours: 24,
        },
    })

    // Load config when available
    useEffect(() => {
        if (config) {
            setFormData(config as any)
        }
    }, [config])

    const handleSave = async () => {
        if (!userId) return
        setSaving(true)
        try {
            await updateConfig({ userId, config: formData })
            toast.success("تم حفظ الإعدادات")
        } catch (error) {
            toast.error("فشل حفظ الإعدادات")
        } finally {
            setSaving(false)
        }
    }

    const toggleDay = (day: number) => {
        const days = formData.availability.workingDays
        const newDays = days.includes(day)
            ? days.filter(d => d !== day)
            : [...days, day].sort((a, b) => a - b)
        setFormData({
            ...formData,
            availability: { ...formData.availability, workingDays: newDays }
        })
    }

    if (!config) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="h-[calc(100vh-4rem)] p-6 sm:p-8 overflow-y-auto" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Link href="/bookings" className="hover:text-foreground transition-colors">
                            الحجوزات
                        </Link>
                        <ArrowRight className="h-3 w-3 rotate-180" />
                        <span>الإعدادات</span>
                    </div>
                    <h1 className="text-2xl font-bold">إعدادات الحجوزات</h1>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                    حفظ التغييرات
                </Button>
            </div>

            <div className="max-w-3xl space-y-6">
                {/* Availability Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            ساعات العمل
                        </CardTitle>
                        <CardDescription>حدد أوقات وأيام العمل المتاحة للحجز</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>وقت البداية</Label>
                                <Input
                                    type="time"
                                    value={formData.availability.businessHours.start}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        availability: {
                                            ...formData.availability,
                                            businessHours: { ...formData.availability.businessHours, start: e.target.value }
                                        }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>وقت النهاية</Label>
                                <Input
                                    type="time"
                                    value={formData.availability.businessHours.end}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        availability: {
                                            ...formData.availability,
                                            businessHours: { ...formData.availability.businessHours, end: e.target.value }
                                        }
                                    })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>أيام العمل</Label>
                            <div className="flex flex-wrap gap-2">
                                {DAYS.map((day) => (
                                    <Button
                                        key={day.value}
                                        variant={formData.availability.workingDays.includes(day.value) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleDay(day.value)}
                                        className="min-w-[70px]"
                                    >
                                        {day.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>مدة الموعد (دقيقة)</Label>
                                <Select
                                    value={String(formData.availability.slotDuration)}
                                    onValueChange={(val) => setFormData({
                                        ...formData,
                                        availability: { ...formData.availability, slotDuration: Number(val) }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 دقيقة</SelectItem>
                                        <SelectItem value="30">30 دقيقة</SelectItem>
                                        <SelectItem value="45">45 دقيقة</SelectItem>
                                        <SelectItem value="60">ساعة</SelectItem>
                                        <SelectItem value="90">ساعة ونصف</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>وقت الفاصل (دقيقة)</Label>
                                <Select
                                    value={String(formData.availability.bufferTime)}
                                    onValueChange={(val) => setFormData({
                                        ...formData,
                                        availability: { ...formData.availability, bufferTime: Number(val) }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">بدون فاصل</SelectItem>
                                        <SelectItem value="5">5 دقائق</SelectItem>
                                        <SelectItem value="10">10 دقائق</SelectItem>
                                        <SelectItem value="15">15 دقيقة</SelectItem>
                                        <SelectItem value="30">30 دقيقة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Meeting Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Video className="h-5 w-5 text-primary" />
                            إعدادات الاجتماع
                        </CardTitle>
                        <CardDescription>حدد الموقع الافتراضي للحجوزات</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>نوع الموقع الافتراضي</Label>
                            <Select
                                value={formData.meeting.defaultLocation}
                                onValueChange={(val) => setFormData({
                                    ...formData,
                                    meeting: { ...formData.meeting, defaultLocation: val }
                                })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="phone">اتصال هاتفي</SelectItem>
                                    <SelectItem value="zoom">Zoom</SelectItem>
                                    <SelectItem value="meet">Google Meet</SelectItem>
                                    <SelectItem value="custom">موقع مخصص</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.meeting.defaultLocation === "zoom" && (
                            <div className="space-y-2">
                                <Label>رابط Zoom</Label>
                                <Input
                                    placeholder="https://zoom.us/j/..."
                                    value={formData.meeting.zoomLink}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        meeting: { ...formData.meeting, zoomLink: e.target.value }
                                    })}
                                />
                            </div>
                        )}

                        {formData.meeting.defaultLocation === "meet" && (
                            <div className="space-y-2">
                                <Label>رابط Google Meet</Label>
                                <Input
                                    placeholder="https://meet.google.com/..."
                                    value={formData.meeting.meetLink}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        meeting: { ...formData.meeting, meetLink: e.target.value }
                                    })}
                                />
                            </div>
                        )}

                        {formData.meeting.defaultLocation === "custom" && (
                            <div className="space-y-2">
                                <Label>الموقع المخصص</Label>
                                <Input
                                    placeholder="مكتب الشركة، الرياض..."
                                    value={formData.meeting.customLocation}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        meeting: { ...formData.meeting, customLocation: e.target.value }
                                    })}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Permissions Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            الصلاحيات
                        </CardTitle>
                        <CardDescription>تحكم في صلاحيات أعضاء الفريق</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>السماح للوكلاء بالتعديل</Label>
                                <p className="text-sm text-muted-foreground">يمكن للوكلاء تعديل الحجوزات</p>
                            </div>
                            <Switch
                                checked={formData.permissions.allowAgentsToEdit}
                                onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    permissions: { ...formData.permissions, allowAgentsToEdit: checked }
                                })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>السماح للوكلاء بالحذف</Label>
                                <p className="text-sm text-muted-foreground">يمكن للوكلاء حذف الحجوزات</p>
                            </div>
                            <Switch
                                checked={formData.permissions.allowAgentsToDelete}
                                onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    permissions: { ...formData.permissions, allowAgentsToDelete: checked }
                                })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>طلب موافقة</Label>
                                <p className="text-sm text-muted-foreground">الحجوزات الجديدة تحتاج موافقة</p>
                            </div>
                            <Switch
                                checked={formData.permissions.requireApproval}
                                onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    permissions: { ...formData.permissions, requireApproval: checked }
                                })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            التنبيهات
                        </CardTitle>
                        <CardDescription>إعدادات التذكير والإشعارات</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label>إرسال تذكير</Label>
                                <p className="text-sm text-muted-foreground">إرسال رسالة تذكير قبل الموعد</p>
                            </div>
                            <Switch
                                checked={formData.notifications.sendReminders}
                                onCheckedChange={(checked) => setFormData({
                                    ...formData,
                                    notifications: { ...formData.notifications, sendReminders: checked }
                                })}
                            />
                        </div>
                        {formData.notifications.sendReminders && (
                            <div className="space-y-2">
                                <Label>وقت التذكير (ساعة)</Label>
                                <Select
                                    value={String(formData.notifications.reminderHours)}
                                    onValueChange={(val) => setFormData({
                                        ...formData,
                                        notifications: { ...formData.notifications, reminderHours: Number(val) }
                                    })}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">ساعة قبل</SelectItem>
                                        <SelectItem value="2">ساعتين قبل</SelectItem>
                                        <SelectItem value="24">يوم قبل</SelectItem>
                                        <SelectItem value="48">يومين قبل</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
