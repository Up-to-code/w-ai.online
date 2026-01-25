"use client"

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
    deliveryRate: {
        label: "معدل التسليم",
        color: "var(--chart-1)",
    },
    readRate: {
        label: "معدل القراءة",
        color: "var(--chart-2)",
    },
} satisfies ChartConfig

interface CampaignRateChartProps {
    data: Array<{
        date: string
        day: string
        deliveryRate: number
        readRate: number
    }>
}

export function CampaignRateChart({ data }: CampaignRateChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                لا توجد بيانات
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <LineChart
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
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                    dataKey="deliveryRate"
                    type="monotone"
                    stroke="var(--color-deliveryRate)"
                    strokeWidth={2}
                    dot={false}
                />
                <Line
                    dataKey="readRate"
                    type="monotone"
                    stroke="var(--color-readRate)"
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ChartContainer>
    )
}
