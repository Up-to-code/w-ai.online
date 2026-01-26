"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
    messages: {
        label: "الرسائل",
        color: "hsl(var(--primary))",
    },
    inbound: {
        label: "واردة",
        color: "#6366f1", // Indigo
    },
    outbound: {
        label: "صادرة",
        color: "#10b981", // Emerald
    },
    campaigns: {
        label: "حملات",
        color: "#f59e0b", // Amber
    },
} satisfies ChartConfig

interface MessagesChartProps {
    data: Array<{
        date: string
        day: string
        messages: number
        inbound: number
        outbound: number
        campaigns: number
    }>
}

export function MessagesChart({ data }: MessagesChartProps) {
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
                    dataKey="inbound"
                    type="natural"
                    fill="url(#fillInbound)"
                    fillOpacity={0.4}
                    stroke="#6366f1"
                    strokeWidth={2}
                    stackId="a"
                />
                <Area
                    dataKey="outbound"
                    type="natural"
                    fill="url(#fillOutbound)"
                    fillOpacity={0.4}
                    stroke="#10b981"
                    strokeWidth={2}
                    stackId="a"
                />
                <defs>
                    <linearGradient id="fillInbound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillOutbound" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                </defs>
            </AreaChart>
        </ChartContainer>
    )
}
