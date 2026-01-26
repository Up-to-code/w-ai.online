"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft } from "lucide-react"
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
    isToday,
    startOfDay,
    isBefore
} from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface PremiumCalendarProps {
    selected?: Date
    onSelect: (date: Date) => void
    disabled?: (date: Date) => boolean
    className?: string
}

export function PremiumCalendar({ selected, onSelect, disabled, className }: PremiumCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(selected || new Date())

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 6 }) // Saturday start for Arabic
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 6 })
        return eachDayOfInterval({ start, end })
    }, [currentMonth])

    const dayNames = ["س", "ح", "ن", "ث", "ر", "خ", "ج"]

    const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    return (
        <div className={cn("w-[280px] select-none", className)} dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={handlePreviousMonth}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <span className="text-sm font-black uppercase tracking-tight text-foreground/80">
                    {format(currentMonth, "MMMM yyyy", { locale: ar })}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-muted"
                    onClick={handleNextMonth}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
            </div>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 mb-2">
                {dayNames.map(d => (
                    <span key={d} className="text-[10px] font-black text-muted-foreground/50 text-center uppercase">
                        {d}
                    </span>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
                {days.map((day, i) => {
                    const isSelected = selected && isSameDay(day, selected)
                    const isCurrentMonth = isSameMonth(day, currentMonth)
                    const isCurrentDay = isToday(day)
                    const isDisabled = disabled ? disabled(day) : false

                    return (
                        <div
                            key={i}
                            onClick={() => !isDisabled && onSelect(day)}
                            className={cn(
                                "h-9 flex items-center justify-center cursor-pointer text-xs font-bold relative transition-all rounded-[12px]",
                                !isCurrentMonth && "opacity-20",
                                isSelected
                                    ? "bg-primary text-white shadow-sm"
                                    : "hover:bg-muted/50 text-foreground/70",
                                isDisabled && "opacity-20 cursor-not-allowed hover:bg-transparent",
                                isCurrentDay && !isSelected && "text-primary"
                            )}
                        >
                            {isCurrentDay && !isSelected && (
                                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                            )}
                            {day.getDate()}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
