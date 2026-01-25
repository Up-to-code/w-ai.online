"use client"

import { Pie, PieChart, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
    sent: {
        label: "مرسلة",
        color: "var(--chart-1)",
    },
    delivered: {
        label: "مستلمة",
        color: "var(--chart-2)",
    },
    read: {
        label: "مقروءة",
        color: "var(--chart-3)",
    },
    failed: {
        label: "فاشلة",
        color: "var(--destructive)",
    },
} satisfies ChartConfig

interface MessageStatusChartProps {
    data: {
        sent: number
        delivered: number
        read: number
        failed: number
    }
}

export function MessageStatusChart({ data }: MessageStatusChartProps) {
    const chartData = [
        { name: "sent", value: data.sent, fill: "var(--color-sent)" },
        { name: "delivered", value: data.delivered, fill: "var(--color-delivered)" },
        { name: "read", value: data.read, fill: "var(--color-read)" },
        { name: "failed", value: data.failed, fill: "var(--color-failed)" },
    ].filter(item => item.value > 0)

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                لا توجد بيانات
            </div>
        )
    }

    return (
        <ChartContainer config={chartConfig} className="h-[180px] w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    strokeWidth={5}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend 
                  content={(props: any) => {
                    if (!props?.payload) return null
                    return <ChartLegendContent payload={props.payload} verticalAlign={props.verticalAlign} nameKey="name" />
                  }} 
                />
            </PieChart>
        </ChartContainer>
    )
}
