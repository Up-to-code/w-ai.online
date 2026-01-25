"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
    messages: {
        label: "الرسائل",
        color: "var(--chart-1)",
    },
    sent: {
        label: "مرسلة",
        color: "var(--chart-2)",
    },
    delivered: {
        label: "مستلمة",
        color: "var(--chart-3)",
    },
    read: {
        label: "مقروءة",
        color: "var(--chart-4)",
    },
} satisfies ChartConfig

interface CampaignPerformanceChartProps {
    data: Array<{
        date: string
        day: string
        messages: number
        sent: number
        delivered: number
        read: number
        failed: number
    }>
}

export function CampaignPerformanceChart({ data }: CampaignPerformanceChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                لا توجد بيانات للعرض
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-[240px] w-full">
            <AreaChart
                accessibilityLayer
                data={data}
                margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
            >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                    dataKey="sent"
                    type="natural"
                    fill="var(--color-sent)"
                    fillOpacity={0.4}
                    stroke="var(--color-sent)"
                    stackId="a"
                />
                <Area
                    dataKey="delivered"
                    type="natural"
                    fill="var(--color-delivered)"
                    fillOpacity={0.4}
                    stroke="var(--color-delivered)"
                    stackId="a"
                />
                <Area
                    dataKey="read"
                    type="natural"
                    fill="var(--color-read)"
                    fillOpacity={0.4}
                    stroke="var(--color-read)"
                    stackId="a"
                />
            </AreaChart>
        </ChartContainer>
    )
}
