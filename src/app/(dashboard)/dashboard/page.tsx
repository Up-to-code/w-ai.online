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
    ArrowRight
} from "lucide-react"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useQuery } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { TimeFilter, type TimeFilterValue } from "@/components/dashboard/TimeFilter"
import { MessagesChart } from "@/components/dashboard/MessagesChart"
import { DeliveryRateChart } from "@/components/dashboard/DeliveryRateChart"
import { MessageStatusChart } from "@/components/dashboard/MessageStatusChart"

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

    // Show loading if user is still loading (layout will handle redirect if not authenticated)
    if (userLoading) {
        return <div className="p-4 sm:p-6 space-y-6 animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
            </div>
        </div>
    }

    // Show loading if stats are being fetched
    if (!stats) {
        return <div className="p-4 sm:p-6 space-y-6 animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
                <div className="h-32 bg-muted rounded-xl"></div>
            </div>
        </div>
    }

    return (
        <div className="p-4 sm:p-6 space-y-4 bg-background min-h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">مرحباً بك 👋</h1>
                    <p className="text-muted-foreground mt-1">إليك نظرة عامة على أداء واتساب للأعمال</p>
                </div>
                <div className="flex gap-2 items-center">
                    <TimeFilter value={timeFilter} onChange={setTimeFilter} />
                    <Link href="/campaigns/new">
                        <Button className="gap-2 bg-[#004D3D] hover:bg-[#003D2D]">
                            <Plus className="h-4 w-4" />
                            حملة جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">إجمالي الرسائل</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.totalMessages.toLocaleString()}</p>
                                {stats.totalMessagesTrend !== undefined && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                                        stats.totalMessagesTrend >= 0 ? 'text-success' : 'text-destructive'
                                    }`}>
                                        {stats.totalMessagesTrend >= 0 ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                        {stats.totalMessagesTrend >= 0 ? '+' : ''}{stats.totalMessagesTrend.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">العملاء</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.totalContacts.toLocaleString()}</p>
                                {stats.totalContactsTrend !== undefined && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                                        stats.totalContactsTrend >= 0 ? 'text-success' : 'text-destructive'
                                    }`}>
                                        {stats.totalContactsTrend >= 0 ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                        {stats.totalContactsTrend >= 0 ? '+' : ''}{stats.totalContactsTrend.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">معدل التسليم</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.deliveryRate ? stats.deliveryRate.toFixed(1) : 0}%</p>
                                {stats.deliveryRateTrend !== undefined && stats.deliveryRateTrend !== 0 && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                                        stats.deliveryRateTrend >= 0 ? 'text-success' : 'text-destructive'
                                    }`}>
                                        {stats.deliveryRateTrend >= 0 ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                        {stats.deliveryRateTrend >= 0 ? '+' : ''}{stats.deliveryRateTrend.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-info/10 flex items-center justify-center">
                                <Send className="h-5 w-5 sm:h-6 sm:w-6 text-info" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-muted-foreground">معدل القراءة</p>
                                <p className="text-2xl sm:text-3xl font-bold mt-1">{stats.readRate ? stats.readRate.toFixed(1) : 0}%</p>
                                {stats.readRateTrend !== undefined && stats.readRateTrend !== 0 && (
                                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                                        stats.readRateTrend >= 0 ? 'text-success' : 'text-destructive'
                                    }`}>
                                        {stats.readRateTrend >= 0 ? (
                                            <TrendingUp className="h-4 w-4" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4" />
                                        )}
                                        {stats.readRateTrend >= 0 ? '+' : ''}{stats.readRateTrend.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                                <Eye className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section - Compact Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Main Messages Chart - 2/3 width */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>أداء الرسائل</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.chartData && stats.chartData.length > 0 ? (
                            <MessagesChart data={stats.chartData} />
                        ) : (
                            <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                                لا توجد بيانات للعرض
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Message Status Breakdown - 1/3 width */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>توزيع حالة الرسائل</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.messageStatusData ? (
                            <MessageStatusChart data={stats.messageStatusData} />
                        ) : (
                            <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                                لا توجد بيانات
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delivery Rate Chart - Full width, compact */}
            <Card>
                <CardHeader>
                    <CardTitle>معدلات الأداء</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats.chartData && stats.chartData.length > 0 ? (
                        <DeliveryRateChart data={stats.chartData} />
                    ) : (
                        <div className="flex items-center justify-center h-[180px] text-muted-foreground">
                            لا توجد بيانات
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>النشاط الأخير</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                        {stats.recentActivity?.map((activity: any) => (
                            <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activity.type === 'message' ? 'bg-primary/10' :
                                    activity.type === 'broadcast' ? 'bg-info/10' :
                                        activity.type === 'template' ? 'bg-success/10' :
                                            activity.type === 'workflow' ? 'bg-warning/10' :
                                                'bg-muted'
                                    }`}>
                                    {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-primary" />}
                                    {activity.type === 'broadcast' && <Radio className="h-5 w-5 text-info" />}
                                    {activity.type === 'template' && <FileText className="h-5 w-5 text-success" />}
                                    {activity.type === 'customer' && <Users className="h-5 w-5 text-muted-foreground" />}
                                    {activity.type === 'workflow' && <Zap className="h-5 w-5 text-warning" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{activity.action}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(activity.time).toLocaleString('ar-EG')}</p>
                                </div>
                            </div>
                        ))}
                        {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                            <div className="text-center py-4 text-muted-foreground">لا يوجد نشاط حديث</div>
                        )}
                    </CardContent>
            </Card>
        </div>
    )
}
