"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
    MessageSquare,
    Users,
    Send,
    CheckCircle2,
    Eye,
    TrendingUp,
    TrendingDown,
    Radio,
    FileText,
    Zap,
    Plus,
    History,
    ArrowRight,
    ArrowLeft
} from "lucide-react"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { PeriodSelector, type PeriodValue, type TimeFilterValue } from "@/components/dashboard/PeriodSelector"
import { MessagesChart } from "@/components/dashboard/MessagesChart"
import { DeliveryRateChart } from "@/components/dashboard/DeliveryRateChart"
import { MessageStatusChart } from "@/components/dashboard/MessageStatusChart"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
    const { isLoading: userLoading, userId } = useUserContext()
    const { currentOrganization } = useOrganizationContext()
    const organizationId = currentOrganization?._id
    const [timeFilter, setTimeFilter] = useState<TimeFilterValue>({ period: "7d" })

    const stats = useQuery(
        api.stats.getDashboardStats,
        organizationId
            ? {
                organizationId,
                period: timeFilter.period,
                startDate: timeFilter.startDate?.getTime(),
                endDate: timeFilter.endDate?.getTime()
            }
            : userId
                ? {
                    userId,
                    period: timeFilter.period,
                    startDate: timeFilter.startDate?.getTime(),
                    endDate: timeFilter.endDate?.getTime()
                }
                : "skip"
    )

    if (userLoading || !stats) {
        return (
            <div className="p-8 sm:p-12 space-y-8 animate-pulse" dir="rtl">
                <div className="h-12 bg-slate-100 rounded-[16px] w-1/4"></div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-slate-100 rounded-[16px]"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-80 bg-slate-100 rounded-[16px]"></div>
                    <div className="h-80 bg-slate-100 rounded-[16px]"></div>
                </div>
            </div>
        )
    }

    const mainStats = [
        { label: "إجمالي الرسائل", value: stats.totalMessages, trend: stats.totalMessagesTrend, icon: MessageSquare, color: "text-primary bg-primary/10" },
        { label: "العملاء الجدد", value: stats.totalContacts, trend: stats.totalContactsTrend, icon: Users, color: "text-success bg-success/10" },
        { label: "معدل التسليم", value: `${stats.deliveryRate?.toFixed(1) || 0}%`, trend: stats.deliveryRateTrend, icon: Send, color: "text-info bg-info/10" },
        { label: "معدل القراءة", value: `${stats.readRate?.toFixed(1) || 0}%`, trend: stats.readRateTrend, icon: Eye, color: "text-warning bg-warning/10" },
    ]

    return (
        <div className="p-8 sm:p-12 space-y-10 bg-background min-h-full" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black text-foreground tracking-tight">لوحة التحكم</h1>
                    <p className="text-muted-foreground font-medium">نظرة سريعة على أداء عملك اليوم</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                    <PeriodSelector value={timeFilter} onChange={setTimeFilter} />
                    <Link href="/campaigns/new" className="w-full sm:w-auto">
                        <Button className="w-full h-11 px-8 gap-2 bg-[#004D3D] hover:bg-[#003D2D] rounded-[16px] font-bold">
                            <Plus className="h-4 w-4" />
                            حملة جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {mainStats.map((stat, i) => (
                    <Card key={i} className="border-none bg-card hover:bg-slate-50/50 transition-colors rounded-[16px] overflow-hidden group">
                        <CardContent className="pt-8 pb-8 px-8">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-3xl font-black text-foreground tracking-tight">{typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}</p>
                                    {stat.trend !== undefined && (
                                        <div className={cn(
                                            "flex items-center gap-1 mt-2 text-xs font-black",
                                            stat.trend >= 0 ? 'text-success' : 'text-danger'
                                        )}>
                                            {stat.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {Math.abs(stat.trend).toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                                <div className={cn("w-14 h-14 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.color)}>
                                    <stat.icon className="h-7 w-7" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none bg-card rounded-[16px] overflow-hidden p-4">
                    <CardHeader className="px-6 pb-2">
                        <CardTitle className="text-xl font-bold">أداء الرسائل</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.chartData && stats.chartData.length > 0 ? (
                            <MessagesChart data={stats.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground font-medium">
                                لا توجد بيانات كافية للفترة المحددة
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-1 border-none bg-card rounded-[16px] overflow-hidden p-4">
                    <CardHeader className="px-6 pb-2">
                        <CardTitle className="text-xl font-bold">توزيع الحالة</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.messageStatusData ? (
                            <MessageStatusChart data={stats.messageStatusData} />
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-muted-foreground font-medium">
                                لا توجد بيانات
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delivery Performance & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                <Card className="border-none bg-card rounded-[16px] overflow-hidden p-4">
                    <CardHeader className="px-6 pb-2">
                        <CardTitle className="text-xl font-bold">معدلات الأداء</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.chartData && stats.chartData.length > 0 ? (
                            <DeliveryRateChart data={stats.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-[200px] text-muted-foreground font-medium">
                                لا توجد بيانات
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none bg-card rounded-[16px] overflow-hidden p-4">
                    <CardHeader className="px-6 pb-2 flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-bold">النشاط الأخير</CardTitle>
                        <History className="h-5 w-5 text-muted-foreground opacity-30" />
                    </CardHeader>
                    <CardContent className="space-y-4 px-6">
                        {stats.recentActivity?.slice(0, 5).map((activity: any) => (
                            <div key={activity.id} className="flex items-center gap-5 p-4 rounded-[16px] hover:bg-slate-50 transition-colors group">
                                <div className={cn(
                                    "w-12 h-12 rounded-[16px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                    activity.type === 'message' ? 'bg-primary/10 text-primary' :
                                        activity.type === 'broadcast' ? 'bg-info/10 text-info' :
                                            activity.type === 'template' ? 'bg-success/10 text-success' :
                                                activity.type === 'workflow' ? 'bg-warning/10 text-warning' :
                                                    'bg-slate-100 text-slate-500'
                                )}>
                                    {activity.type === 'message' && <MessageSquare className="h-6 w-6" />}
                                    {activity.type === 'broadcast' && <Radio className="h-6 w-6" />}
                                    {activity.type === 'template' && <FileText className="h-6 w-6" />}
                                    {activity.type === 'customer' && <Users className="h-6 w-6" />}
                                    {activity.type === 'workflow' && <Zap className="h-6 w-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-foreground truncate">{activity.action}</p>
                                    <p className="text-xs text-muted-foreground font-medium">{new Date(activity.time).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <ArrowLeft className="h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                        {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                            <div className="text-center py-10">
                                <History className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">لا يوجد نشاط حديث لعرضه</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
