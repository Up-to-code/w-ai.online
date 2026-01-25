"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

export type TimeFilterValue = {
    period?: "7d" | "30d" | "90d" | "all"
    startDate?: Date
    endDate?: Date
}

interface TimeFilterProps {
    value: TimeFilterValue
    onChange: (value: TimeFilterValue) => void
    className?: string
}

export function TimeFilter({ value, onChange, className }: TimeFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        if (value.startDate && value.endDate) {
            return { from: value.startDate, to: value.endDate }
        }
        return undefined
    })

    // Sync dateRange with value prop when it changes externally
    useEffect(() => {
        if (value.startDate && value.endDate) {
            setDateRange({ from: value.startDate, to: value.endDate })
        } else if (!value.startDate && !value.endDate) {
            setDateRange(undefined)
        }
    }, [value.startDate, value.endDate])

    const handlePresetSelect = (period: "7d" | "30d" | "90d" | "all") => {
        const now = new Date()
        now.setHours(23, 59, 59, 999) // End of today
        
        let startDate: Date
        
        switch (period) {
            case "7d":
                startDate = new Date(now)
                startDate.setDate(startDate.getDate() - 6)
                startDate.setHours(0, 0, 0, 0)
                break
            case "30d":
                startDate = new Date(now)
                startDate.setDate(startDate.getDate() - 29)
                startDate.setHours(0, 0, 0, 0)
                break
            case "90d":
                startDate = new Date(now)
                startDate.setDate(startDate.getDate() - 89)
                startDate.setHours(0, 0, 0, 0)
                break
            case "all":
            default:
                startDate = new Date(0) // Beginning of time
                break
        }
        
        const endDate = period === "all" ? new Date() : now
        
        // Update both state and call onChange
        const range: DateRange = { from: startDate, to: endDate }
        setDateRange(range)
        onChange({
            period,
            startDate,
            endDate
        })
    }

    const handleDateRangeSelect = (range: DateRange | undefined) => {
        setDateRange(range)
        
        // When both dates are selected, apply the range
        if (range?.from && range?.to) {
            // Ensure times are set correctly
            const startDate = new Date(range.from)
            startDate.setHours(0, 0, 0, 0)
            
            const endDate = new Date(range.to)
            endDate.setHours(23, 59, 59, 999)
            
            onChange({
                period: undefined, // Clear preset when custom range is used
                startDate,
                endDate
            })
            setIsOpen(false) // Close popover after selection
        } else if (range?.from) {
            // Only start date selected - wait for end date
            // Don't call onChange yet
        } else {
            // Range cleared
            onChange({
                period: undefined,
                startDate: undefined,
                endDate: undefined
            })
        }
    }

    const getDisplayText = () => {
        if (value.startDate && value.endDate) {
            return `${format(value.startDate, "d MMM", { locale: ar })} - ${format(value.endDate, "d MMM", { locale: ar })}`
        }
        switch (value.period) {
            case "7d":
                return "آخر 7 أيام"
            case "30d":
                return "آخر 30 يوم"
            case "90d":
                return "آخر 90 يوم"
            case "all":
                return "كل الوقت"
            default:
                return "اختر الفترة"
        }
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Preset Period Buttons */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                <Button
                    variant={value.period === "7d" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePresetSelect("7d")}
                    className="h-8"
                >
                    7 أيام
                </Button>
                <Button
                    variant={value.period === "30d" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePresetSelect("30d")}
                    className="h-8"
                >
                    30 يوم
                </Button>
                <Button
                    variant={value.period === "90d" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePresetSelect("90d")}
                    className="h-8"
                >
                    90 يوم
                </Button>
                <Button
                    variant={value.period === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handlePresetSelect("all")}
                    className="h-8"
                >
                    الكل
                </Button>
            </div>

            {/* Custom Date Range Picker */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-8 justify-start text-left font-normal min-w-[200px]",
                            !value.startDate && !value.endDate && !value.period && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {getDisplayText()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleDateRangeSelect}
                        locale={ar}
                        numberOfMonths={1}
                        className="rounded-md border-0"
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
