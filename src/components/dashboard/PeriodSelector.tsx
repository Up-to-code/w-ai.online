"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, ChevronDown, ChevronRight, ChevronLeft } from "lucide-react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    isToday,
    startOfDay,
    endOfDay
} from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

export type PeriodValue = "7d" | "30d" | "90d" | "all" | "custom"

export type TimeFilterValue = {
    period: PeriodValue
    startDate?: Date
    endDate?: Date
}

interface PeriodSelectorProps {
    value: TimeFilterValue
    onChange: (value: TimeFilterValue) => void
    className?: string
}

export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [tempRange, setTempRange] = useState<{ start?: Date; end?: Date }>({})

    // Sync tempRange when internal value changes or popover opens
    useEffect(() => {
        if (isOpen) {
            setTempRange({ start: value.startDate, end: value.endDate })
            if (value.startDate) setCurrentMonth(value.startDate)
        }
    }, [isOpen, value.startDate, value.endDate])

    const periods: { label: string; value: PeriodValue }[] = [
        { label: "7 أيام", value: "7d" },
        { label: "30 يوم", value: "30d" },
        { label: "90 يوم", value: "90d" },
        { label: "الكل", value: "all" },
    ]

    const handlePeriodSelect = (p: PeriodValue) => {
        onChange({ period: p, startDate: undefined, endDate: undefined })
    }

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 6 }) // Saturday start for Arabic
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 6 })
        return eachDayOfInterval({ start, end })
    }, [currentMonth])

    const handleDayClick = (day: Date) => {
        const clickedDay = startOfDay(day)

        if (!tempRange.start || (tempRange.start && tempRange.end)) {
            // Start new selection
            setTempRange({ start: clickedDay, end: undefined })
        } else {
            // Finish selection
            if (clickedDay < tempRange.start) {
                setTempRange({ start: clickedDay, end: endOfDay(tempRange.start) })
            } else {
                setTempRange({ start: tempRange.start, end: endOfDay(clickedDay) })
            }
        }
    }

    const handleApply = () => {
        if (tempRange.start && tempRange.end) {
            onChange({
                period: "custom",
                startDate: tempRange.start,
                endDate: tempRange.end
            })
            setIsOpen(false)
        }
    }

    const isInRange = (day: Date) => {
        if (!tempRange.start || !tempRange.end) return false
        return isWithinInterval(startOfDay(day), { start: tempRange.start, end: tempRange.end })
    }

    const isStart = (day: Date) => tempRange.start && isSameDay(day, tempRange.start)
    const isEnd = (day: Date) => tempRange.end && isSameDay(day, tempRange.end)

    const getDisplayText = () => {
        if (value.period === "custom" && value.startDate && value.endDate) {
            return `${format(value.startDate, "d MMM", { locale: ar })} - ${format(value.endDate, "d MMM", { locale: ar })}`
        } else if (value.period === "custom" && value.startDate) {
            return `من ${format(value.startDate, "d MMM", { locale: ar })}`
        }
        return periods.find(p => p.value === value.period)?.label || "فترة مخصصة"
    }

    const dayNames = ["س", "ح", "ن", "ث", "ر", "خ", "ج"]

    return (
        <div className={cn("flex items-center gap-3", className)} dir="rtl">
            {/* Standard Toggles */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-[16px] border border-slate-200/50 dark:border-slate-800/50">
                {periods.map((period) => (
                    <Button
                        key={period.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePeriodSelect(period.value)}
                        className={cn(
                            "h-9 px-4 rounded-[16px] text-xs font-bold transition-all duration-300",
                            value.period === period.value
                                ? "bg-white dark:bg-slate-800 text-primary shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        {period.label}
                    </Button>
                ))}
            </div>

            {/* Bespoke Custom Calendar Trigger */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "h-11 px-4 rounded-[16px] border-slate-200/50 flex items-center gap-2 font-bold text-xs transition-all",
                            value.period === "custom" ? "border-primary text-primary bg-primary/5" : "text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <CalendarIcon className="h-4 w-4" />
                        <span>{getDisplayText()}</span>
                        <ChevronDown className={cn("h-3 w-3 opacity-50 transition-transform", isOpen && "rotate-180")} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-0 rounded-[16px] border border-slate-100 dark:border-slate-800 shadow-2xl bg-card overflow-hidden" align="end">
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-black uppercase tracking-tight">
                            {format(currentMonth, "MMMM yyyy", { locale: ar })}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="p-4">
                        <div className="grid grid-cols-7 mb-2">
                            {dayNames.map(d => (
                                <span key={d} className="text-[10px] font-black text-slate-400 text-center uppercase">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1">
                            {days.map((day, i) => {
                                const active = isInRange(day)
                                const start = isStart(day)
                                const end = isEnd(day)
                                const current = isSameMonth(day, currentMonth)
                                const todayFlag = isToday(day)

                                return (
                                    <div
                                        key={i}
                                        onClick={() => handleDayClick(day)}
                                        className={cn(
                                            "h-9 flex items-center justify-center cursor-pointer text-xs font-bold relative transition-all",
                                            !current && "opacity-20",
                                            active && !start && !end && "bg-primary/10 text-primary",
                                            start && "bg-primary text-white rounded-r-xl",
                                            end && "bg-primary text-white rounded-l-xl",
                                            active && start && tempRange.end && "rounded-l-none", // Changed value.endDate to tempRange.end
                                            active && end && "rounded-r-none",
                                            !active && !start && !end && "hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                                        )}
                                    >
                                        {todayFlag && !start && !end && (
                                            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                                        )}
                                        {day.getDate()}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] font-black uppercase text-slate-400 hover:text-primary transition-colors"
                            onClick={() => {
                                onChange({ period: "7d", startDate: undefined, endDate: undefined })
                                setIsOpen(false)
                            }}
                        >
                            إغلاق
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 px-4 rounded-full text-[10px] font-black bg-primary hover:bg-primary/90"
                            disabled={!tempRange.start || !tempRange.end}
                            onClick={handleApply}
                        >
                            تحديد الفترة
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
