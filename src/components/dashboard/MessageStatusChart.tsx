"use client"

import { Pie, PieChart, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = {
    sent: {
        label: "مرسلة",
        color: "#6366f1",
    },
    delivered: {
        label: "مستلمة",
        color: "#10b981",
    },
    read: {
        label: "مقروءة",
        color: "#f59e0b",
    },
    failed: {
        label: "فاشلة",
        color: "#ef4444",
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
        { name: "sent", value: data.sent, fill: "#6366f1" },
        { name: "delivered", value: data.delivered, fill: "#10b981" },
        { name: "read", value: data.read, fill: "#f59e0b" },
        { name: "failed", value: data.failed, fill: "#ef4444" },
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
