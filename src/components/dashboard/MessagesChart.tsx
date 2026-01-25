"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
    messages: {
        label: "الرسائل",
        color: "var(--chart-1)",
    },
    inbound: {
        label: "واردة",
        color: "var(--chart-2)",
    },
    outbound: {
        label: "صادرة",
        color: "var(--chart-3)",
    },
    campaigns: {
        label: "حملات",
        color: "var(--chart-4)",
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
                    fill="var(--color-inbound)"
                    fillOpacity={0.4}
                    stroke="var(--color-inbound)"
                    stackId="a"
                />
                <Area
                    dataKey="outbound"
                    type="natural"
                    fill="var(--color-outbound)"
                    fillOpacity={0.4}
                    stroke="var(--color-outbound)"
                    stackId="a"
                />
            </AreaChart>
        </ChartContainer>
    )
}
