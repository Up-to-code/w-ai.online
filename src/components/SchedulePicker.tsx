"use client"

import { useState, useEffect } from "react"
import { PremiumCalendar } from "@/components/ui/PremiumCalendar"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarIcon, Clock, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react"
import { format, addDays, isSameDay, isWeekend, startOfToday, isBefore } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface SchedulePickerProps {
  value?: string // ISO datetime string or empty
  onChange: (datetime: string | null) => void
  label?: string
}

// Recommended times configuration
const RECOMMENDED_CONFIG = {
  bestHours: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
  avoidHours: [0, 1, 2, 3, 4, 5, 6, 7, 22, 23],
  bestDays: [1, 2, 3, 4, 5], // Monday-Friday
  avoidDays: [0, 6], // Sunday, Saturday
}

function isRecommendedTime(date: Date, hour: number): { isRecommended: boolean; reason?: string } {
  const dayOfWeek = date.getDay()

  // Check if weekend
  if (RECOMMENDED_CONFIG.avoidDays.includes(dayOfWeek)) {
    return { isRecommended: false, reason: "عطلة نهاية الأسبوع" }
  }

  // Check if avoid hours
  if (RECOMMENDED_CONFIG.avoidHours.includes(hour)) {
    return { isRecommended: false, reason: hour < 8 ? "وقت مبكر جداً" : "وقت متأخر جداً" }
  }

  // Check if best hours
  if (RECOMMENDED_CONFIG.bestHours.includes(hour)) {
    return { isRecommended: true }
  }

  // Neutral time (not best, but acceptable)
  return { isRecommended: true, reason: "وقت مقبول" }
}

export function SchedulePicker({ value = "", onChange, label = "وقت الإرسال" }: SchedulePickerProps) {
  const [isScheduled, setIsScheduled] = useState(!!value)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  )
  const [selectedHour, setSelectedHour] = useState<number>(
    value ? new Date(value).getHours() : 9
  )
  const [selectedMinute, setSelectedMinute] = useState<number>(
    value ? new Date(value).getMinutes() : 0
  )

  // Update parent when schedule changes
  useEffect(() => {
    if (isScheduled && selectedDate) {
      const datetime = new Date(selectedDate)
      datetime.setHours(selectedHour, selectedMinute, 0, 0)

      // Ensure future date
      if (datetime > new Date()) {
        onChange(datetime.toISOString())
      }
    } else if (!isScheduled) {
      onChange(null)
    }
  }, [isScheduled, selectedDate, selectedHour, selectedMinute, onChange])

  // Parse existing value on mount
  useEffect(() => {
    if (value && value.trim() !== "") {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        setSelectedDate(date)
        setSelectedHour(date.getHours())
        setSelectedMinute(date.getMinutes())
        setIsScheduled(true)
      }
    }
  }, [value])

  // When enabling scheduling, set default to tomorrow at 9 AM
  const handleEnableScheduling = (checked: boolean) => {
    setIsScheduled(checked)
    if (checked && !selectedDate) {
      const tomorrow = addDays(startOfToday(), 1)
      setSelectedDate(tomorrow)
      setSelectedHour(9)
      setSelectedMinute(0)
    } else if (!checked) {
      onChange(null)
    }
  }

  const validation = selectedDate
    ? isRecommendedTime(selectedDate, selectedHour)
    : { isRecommended: true }

  const selectedDateTime = selectedDate
    ? (() => {
      const dt = new Date(selectedDate)
      dt.setHours(selectedHour, selectedMinute, 0, 0)
      return dt
    })()
    : null

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-black">{label}</Label>

        {/* Selectable Options - Send Now vs Schedule Later */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {/* Send Now Option */}
          <div
            className={cn(
              "p-6 border-2 rounded-[20px] cursor-pointer transition-all duration-300 relative overflow-hidden group",
              !isScheduled
                ? 'border-primary bg-primary/5'
                : 'border-border/50 hover:border-primary/50 hover:bg-muted/10'
            )}
            onClick={() => {
              if (isScheduled) {
                handleEnableScheduling(false)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                !isScheduled ? 'border-primary' : 'border-muted-foreground'
              )}>
                {!isScheduled && <div className="w-3 h-3 rounded-full bg-primary" />}
              </div>
              <span className="font-black text-lg tracking-tight">إرسال فوري</span>
            </div>
            <p className="text-sm text-muted-foreground mr-9 font-medium leading-relaxed">
              سيتم بدء الحملة فور الانتهاء من الإعداد لجميع جهات الاتصال المحددة.
            </p>
          </div>

          {/* Schedule Later Option */}
          <div
            className={cn(
              "p-6 border-2 rounded-[20px] cursor-pointer transition-all duration-300 relative overflow-hidden group",
              isScheduled
                ? 'border-primary bg-primary/5'
                : 'border-border/50 hover:border-primary/50 hover:bg-muted/10'
            )}
            onClick={() => {
              if (!isScheduled) {
                handleEnableScheduling(true)
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                isScheduled ? 'border-primary' : 'border-muted-foreground'
              )}>
                {isScheduled && <div className="w-3 h-3 rounded-full bg-primary" />}
              </div>
              <span className="font-black text-lg tracking-tight">جدولة لوقت لاحق</span>
            </div>
            <p className="text-sm text-muted-foreground mr-9 font-medium leading-relaxed">
              اختر الوقت والتاريخ المثاليين لضمان أعلى معدل قراءة وتفاعل.
            </p>
          </div>
        </div>
      </div>

      {/* Schedule Options (shown when enabled) */}
      {isScheduled && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 pt-4 border-t border-border/30">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Calendar */}
            <div className="space-y-3">
              <Label className="text-sm font-black flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                تحديد تاريخ الإرسال
              </Label>
              <div className="p-3 bg-muted/5 rounded-[24px] border border-border/50 flex justify-center">
                <PremiumCalendar
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      const newDate = new Date(date)
                      newDate.setHours(selectedHour, selectedMinute, 0, 0)
                      if (newDate <= new Date()) {
                        const tomorrow = addDays(startOfToday(), 1)
                        tomorrow.setHours(selectedHour, selectedMinute, 0, 0)
                        setSelectedDate(tomorrow)
                      } else {
                        setSelectedDate(date)
                      }
                    }
                  }}
                  disabled={(date) => isBefore(date, startOfToday())}
                  className="mx-auto"
                />
              </div>
            </div>

            {/* Time Picker & Recommendations */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-black flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  تحديد ساعة الإرسال
                </Label>
                <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-[16px] border border-border/50">
                  <div className="flex-1 flex justify-center items-center gap-3">
                    <Select
                      value={selectedHour.toString()}
                      onValueChange={(val) => setSelectedHour(parseInt(val, 10))}
                    >
                      <SelectTrigger className="w-24 h-10 text-xl font-black rounded-[12px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem
                            key={i}
                            value={i.toString()}
                            className={cn(
                              "font-bold text-base",
                              RECOMMENDED_CONFIG.bestHours.includes(i) && "bg-success/10 text-success",
                              RECOMMENDED_CONFIG.avoidHours.includes(i) && "bg-destructive/10 text-destructive"
                            )}
                          >
                            {i.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-2xl font-black text-muted-foreground">:</span>
                    <Select
                      value={selectedMinute.toString()}
                      onValueChange={(val) => setSelectedMinute(parseInt(val, 10))}
                    >
                      <SelectTrigger className="w-24 h-10 text-xl font-black rounded-[12px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => (
                          <SelectItem key={m} value={m.toString()} className="font-bold text-base">
                            {m.toString().padStart(2, "0")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Validation Feedback */}
              {selectedDateTime && (
                <div className={cn(
                  "p-4 rounded-[20px] border flex items-start gap-4 transition-all",
                  validation.isRecommended
                    ? "bg-success/5 border-success/20"
                    : "bg-warning/5 border-warning/20"
                )}>
                  {validation.isRecommended ? (
                    <CheckCircle2 className="h-6 w-6 text-success mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-warning mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1">
                    <p className={cn(
                      "text-base font-black",
                      validation.isRecommended ? "text-success" : "text-warning-dark"
                    )}>
                      {validation.isRecommended ? "توقيت إرسال مثالي" : "تنبيه التوقيت"}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                      {validation.isRecommended
                        ? `جدولة ليوم ${format(selectedDateTime, "EEEE، d MMMM", { locale: ar })} الساعة ${format(selectedDateTime, "p", { locale: ar })}.`
                        : validation.reason || "هذا الوقت قد لا يكون مثالياً لضمان أعلى نسبة فتح."}
                    </p>
                  </div>
                </div>
              )}

              {/* Best Practices */}
              <div className="bg-primary/5 rounded-[20px] border border-primary/20 p-6 space-y-3">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Lightbulb className="h-5 w-5" />
                  <span className="text-base font-black tracking-tight underline decoration-primary/30 underline-offset-4">نصائح الخبراء للجدولة</span>
                </div>
                <ul className="grid grid-cols-1 gap-2">
                  {[
                    "الأوقات الذهبية للإرسال هي من 9 صباحاً حتى 5 مساءً.",
                    "تجنب أيام العطل الرسمية وعطل نهاية الأسبوع.",
                    "إرسال الرسائل في دفعات صغيرة يقلل من احتمالية الحظر.",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-muted-foreground font-medium text-xs">
                      <div className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
