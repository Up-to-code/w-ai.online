"use client"

import { useParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useUserQuery } from "@/hooks/useUserQuery"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  ArrowRight,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Users,
  BarChart3,
  Calendar,
  Phone,
  Send,
  Eye,
  XCircle,
  SkipForward,
  Shield,
  Settings,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import React, { useState } from "react"
import { TimeFilter, type TimeFilterValue } from "@/components/dashboard/TimeFilter"
import { CampaignPerformanceChart } from "@/components/campaigns/CampaignPerformanceChart"
import { CampaignStatusChart } from "@/components/campaigns/CampaignStatusChart"
import { CampaignRateChart } from "@/components/campaigns/CampaignRateChart"

type StatusFilter = "all" | "sent" | "delivered" | "read" | "failed" | "skipped"

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.campaignId as string | undefined
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [activeTab, setActiveTab] = useState("overview")
  const [analyticsTimeFilter, setAnalyticsTimeFilter] = useState<TimeFilterValue>({ period: "all" })
  const [messagingTimeFilter, setMessagingTimeFilter] = useState<TimeFilterValue>({ period: "all" })

  const campaigns = useUserQuery(api.campaigns.list, {})
  const campaign = (campaigns || []).find((c: any) => String(c._id) === id)

  // Fetch campaign analytics with time filter
  const campaignAnalytics = useUserQuery(
    api.campaigns.getCampaignAnalytics,
    campaign ? {
      campaignId: campaign._id as Id<"campaigns">,
      startDate: analyticsTimeFilter.startDate?.getTime(),
      endDate: analyticsTimeFilter.endDate?.getTime(),
    } : {},
    { enabled: !!campaign && activeTab === "analytics" }
  )

  // Fetch campaign logs with time filter - only when we have a valid campaign
  const campaignLogs = useUserQuery(
    api.campaigns.getCampaignLogs,
    campaign ? {
      campaignId: campaign._id as Id<"campaigns">,
      startDate: messagingTimeFilter.startDate?.getTime(),
      endDate: messagingTimeFilter.endDate?.getTime(),
    } : {},
    { enabled: !!campaign }
  )

  if (!id) return null

  if (campaigns === undefined) {
    return <div className="p-8 text-center animate-pulse">جاري التحميل...</div>
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
        <div className="bg-muted/30 p-8 rounded-full mb-4">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">لم يتم العثور على الحملة</h2>
        <p className="text-muted-foreground mb-6">قد تكون هذه الحملة قد حذفت أو أن الرابط غير صحيح</p>
        <Link href="/campaigns">
          <Button variant="outline">العودة إلى الحملات</Button>
        </Link>
      </div>
    )
  }

  const progress = campaign.stats.total > 0
    ? (campaign.stats.sent / campaign.stats.total) * 100
    : 0

  return (
    <div className="space-y-10 p-6 sm:p-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="flex items-start gap-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/campaigns")} className="mt-1 h-12 w-12 rounded-[14px] bg-muted/30 hover:bg-muted">
            <ArrowRight className="h-6 w-6" />
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-4xl font-black tracking-tight text-foreground">{campaign.name}</h1>
              <Badge variant={
                campaign.status === 'COMPLETED' ? 'secondary' :
                  campaign.status === 'PROCESSING' ? 'default' :
                    campaign.status === 'FAILED' ? 'destructive' : 'outline'
              } className="rounded-[8px] font-black text-[10px] px-3 py-1 uppercase tracking-wider border-none">
                {campaign.status === 'COMPLETED' && 'مكتملة'}
                {campaign.status === 'PROCESSING' && 'جاري الإرسال'}
                {campaign.status === 'SCHEDULED' && 'مجدولة'}
                {campaign.status === 'DRAFT' && 'مسودة'}
                {campaign.status === 'FAILED' && 'فشلت'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground font-bold">
              <span className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 opacity-50" />
                تم الإنشاء: {format(campaign.createdAt, "d MMMM yyyy", { locale: ar })}
              </span>
              <span className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 opacity-50" />
                الجدولة: {format(campaign.scheduledAt, "p d MMM", { locale: ar })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="h-14 w-full justify-start gap-2 bg-muted/20 p-2 rounded-[16px] border border-border/50 overflow-x-auto">
          <TabsTrigger value="overview" className="gap-2 px-6 h-10 rounded-[12px] font-black data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border/50">
            <BarChart3 className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2 px-6 h-10 rounded-[12px] font-black data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border/50">
            <TrendingUp className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
          <TabsTrigger value="messaging" className="gap-2 px-6 h-10 rounded-[12px] font-black data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border/50">
            <MessageSquare className="h-4 w-4" />
            سجل الرسائل
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 px-6 h-10 rounded-[12px] font-black data-[state=active]:bg-background data-[state=active]:shadow-none data-[state=active]:border border-border/50">
            <Settings className="h-4 w-4" />
            الإعدادات التبني
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Main Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "إجمالي الجمهور", value: campaign.stats.total, icon: Users, color: "text-primary bg-primary/10" },
              { title: "تم الإرسال", value: campaign.stats.sent, icon: CheckCircle2, color: "text-success bg-success/10", trend: `${Math.round(progress)}%` },
              { title: "تم التخطي", value: campaign.stats.skipped || 0, icon: SkipForward, color: "text-yellow-500 bg-yellow-500/10" },
              { title: "فشل الإرسال", value: campaign.stats.failed, icon: AlertCircle, color: "text-destructive bg-destructive/10" },
              { title: "نسبة القراءة", value: `${Math.round((campaign.stats.read / Math.max(1, campaign.stats.delivered)) * 100)}%`, icon: Eye, color: "text-orange-500 bg-orange-500/10" }
            ].map((stat, i) => (
              <Card key={i} className="border border-border/50 bg-card rounded-[24px] shadow-none group overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex flex-col gap-6">
                    <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center transition-transform group-hover:scale-110", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{stat.title}</p>
                    </div>
                    {stat.trend && (
                      <div className="text-xs font-black text-success bg-success/10 px-2 py-1 rounded-[6px] w-fit">
                        {stat.trend} إنجاز
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Details & Progress */}
            <div className="lg:col-span-2 space-y-8">
              {/* Progress Card */}
              {campaign.status === "PROCESSING" && (
                <Card className="border border-primary/20 bg-primary/[0.02] rounded-[32px] shadow-none overflow-hidden group">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-primary flex items-center gap-3 text-2xl font-black">
                      <div className="relative flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
                      </div>
                      جاري تنفيذ الحملة الآن
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="flex items-center justify-between text-sm mb-4">
                      <span className="text-muted-foreground font-black uppercase tracking-widest">معدل التقدم الحالي</span>
                      <span className="text-2xl font-black text-primary">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-4 rounded-[8px] bg-primary/10" />
                    <div className="flex justify-between items-center mt-6">
                      <p className="text-base text-muted-foreground font-medium">
                        {campaign.stats.sent} رسالة تم إرسالها بنجاح من أصل {campaign.stats.total}
                      </p>
                      <Badge variant="outline" className="rounded-[8px] font-bold border-primary/20 text-primary">Smart Batching Active</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Dashboard Analytics Preview */}
              <Card className="border border-border/50 bg-card rounded-[32px] overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-2xl font-black">مخطط الأداء</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="h-[300px] w-full bg-muted/10 rounded-[20px] border border-dashed border-border/50 flex items-center justify-center">
                    <p className="text-muted-foreground font-bold">يمكنك عرض الرسوم البيانية المفصلة في تبويب التحليلات</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Quick Info */}
            <div className="space-y-8">
              <Card className="border border-border/50 bg-card rounded-[32px] overflow-hidden">
                <CardHeader className="p-8 border-b border-border/30">
                  <CardTitle className="text-xl font-black">بيانات سريعة</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="flex justify-between items-center bg-muted/10 p-4 rounded-[16px]">
                    <span className="text-sm font-bold text-muted-foreground">حالة الحملة</span>
                    <Badge variant="outline" className="rounded-full px-4 border-border/50 font-black text-[10px] uppercase">{campaign.status}</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-muted/10 p-4 rounded-[16px]">
                    <span className="text-sm font-bold text-muted-foreground">معدل التسليم</span>
                    <span className="text-xl font-black text-foreground">
                      {campaign.stats.sent > 0
                        ? `${Math.round((campaign.stats.delivered / campaign.stats.sent) * 100)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-muted/10 p-4 rounded-[16px]">
                    <span className="text-sm font-bold text-muted-foreground">معدل القراءة</span>
                    <span className="text-xl font-black text-foreground">
                      {campaign.stats.delivered > 0
                        ? `${Math.round((campaign.stats.read / campaign.stats.delivered) * 100)}%`
                        : "0%"
                      }
                    </span>
                  </div>
                </CardContent>
              </Card>

              {campaign.status === 'FAILED' && (
                <Card className="border border-destructive/20 bg-destructive/[0.02] rounded-[32px]">
                  <CardHeader className="p-8">
                    <CardTitle className="text-destructive flex items-center gap-3 text-xl font-black">
                      <AlertCircle className="h-6 w-6" />
                      تنبيه تقني
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">
                      توقفت الحملة بسبب مشاكل في تواصل API الخاص بواتساب. يرجى مراجعة سجلات النظام للتأكد من رصيد الرسائل أو حالة الحساب.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Time Filter & Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">تحليلات معمقة</h2>
            <TimeFilter value={analyticsTimeFilter} onChange={setAnalyticsTimeFilter} />
          </div>

          {campaignAnalytics === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-[24px]" />)}
            </div>
          ) : (
            <>
              {/* Analytics Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "إجمالي الرسائل", value: campaignAnalytics.total, icon: MessageSquare, color: "text-primary bg-primary/10" },
                  { label: "معدل التسليم", value: `${campaignAnalytics.deliveryRate.toFixed(1)}%`, icon: CheckCircle2, color: "text-success bg-success/10" },
                  { label: "معدل القراءة", value: `${campaignAnalytics.readRate.toFixed(1)}%`, icon: Eye, color: "text-orange-500 bg-orange-500/10" },
                  { label: "فشل الإرسال", value: campaignAnalytics.failed, icon: XCircle, color: "text-destructive bg-destructive/10" }
                ].map((stat, i) => (
                  <Card key={i} className="border border-border/50 bg-card rounded-[24px] shadow-none overflow-hidden">
                    <CardContent className="p-8 flex items-center gap-6">
                      <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0", stat.color)}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-foreground tracking-tighter">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border border-border/50 bg-card rounded-[32px] shadow-none">
                  <CardHeader className="p-8">
                    <CardTitle className="text-xl font-black">سلوك الإرسال عبر الزمن</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    {campaignAnalytics.chartData && campaignAnalytics.chartData.length > 0 ? (
                      <CampaignPerformanceChart data={campaignAnalytics.chartData} />
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground bg-muted/5 rounded-[24px] border border-dashed border-border/50 font-bold">
                        بانتظار ظهور أولى البيانات الإحصائية
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border border-border/50 bg-card rounded-[32px] shadow-none">
                  <CardHeader className="p-8">
                    <CardTitle className="text-xl font-black">تحليل الحالات</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <CampaignStatusChart data={campaignAnalytics.statusData} />
                  </CardContent>
                </Card>
              </div>

              {/* Rate Chart */}
              <Card className="border border-border/50 bg-card rounded-[32px] shadow-none">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black">كفاءة مسار التسليم</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  {campaignAnalytics.chartData && campaignAnalytics.chartData.length > 0 ? (
                    <CampaignRateChart data={campaignAnalytics.chartData} />
                  ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground font-bold">
                      لا تتوفر معدلات حالياً
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">السجل التقني</h2>
            <TimeFilter value={messagingTimeFilter} onChange={setMessagingTimeFilter} />
          </div>

          <Card className="border border-border/50 bg-card rounded-[32px] shadow-none overflow-hidden">
            <CardHeader className="p-8 border-b border-border/30 bg-muted/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary">
                    <Send className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black leading-none mb-2">سجل المحادثات</CardTitle>
                    <CardDescription className="font-bold text-sm">
                      متابعة حالة الوصول لكل رقم هاتف تم استهدافه
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "الكل", icon: null },
                    { id: "sent", label: "مُرسل", icon: Send },
                    { id: "delivered", label: "مُستلم", icon: CheckCircle2 },
                    { id: "read", label: "مقروء", icon: Eye },
                    { id: "failed", label: "فشل", icon: XCircle },
                    { id: "skipped", label: "تم التخطي", icon: SkipForward }
                  ].map(tab => (
                    <Button
                      key={tab.id}
                      variant={statusFilter === tab.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={cn(
                        "rounded-[10px] h-9 px-4 font-black transition-all border-border/50",
                        statusFilter === tab.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "hover:bg-muted"
                      )}
                    >
                      {tab.icon && <tab.icon className="h-3.5 w-3.5 ml-2" />}
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {campaignLogs === undefined ? (
                <div className="p-20 text-center animate-pulse">جاري سحب السجلات...</div>
              ) : campaignLogs.length === 0 ? (
                <div className="p-20 text-center text-muted-foreground font-bold">لا توجد سجلات حالية</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/10">
                      <TableRow className="border-border/30">
                        <TableHead className="text-right h-14 font-black text-muted-foreground uppercase text-[10px] tracking-widest px-8">جهة الاتصال</TableHead>
                        <TableHead className="text-right h-14 font-black text-muted-foreground uppercase text-[10px] tracking-widest">رقم الهاتف</TableHead>
                        <TableHead className="text-right h-14 font-black text-muted-foreground uppercase text-[10px] tracking-widest">الحالة</TableHead>
                        <TableHead className="text-right h-14 font-black text-muted-foreground uppercase text-[10px] tracking-widest">معرف الرسالة</TableHead>
                        <TableHead className="text-right h-14 font-black text-muted-foreground uppercase text-[10px] tracking-widest px-8">ملاحظات النظام</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaignLogs
                        .filter((log: any) => statusFilter === "all" || log.status === statusFilter)
                        .map((log: any) => (
                          <TableRow key={String(log._id)} className="border-border/30 hover:bg-muted/5 transition-colors">
                            <TableCell className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-[12px] bg-muted/50 flex items-center justify-center font-black text-primary">
                                  {log.contactName?.[0] || 'U'}
                                </div>
                                <span className="font-black text-foreground">{log.contactName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-5 font-bold text-muted-foreground" dir="ltr">{log.contactPhone}</TableCell>
                            <TableCell className="py-5">
                              <Badge
                                variant={
                                  log.status === "read" ? "default" :
                                    log.status === "delivered" ? "secondary" :
                                      log.status === "sent" ? "outline" :
                                        log.status === "skipped" ? "outline" :
                                          "destructive"
                                }
                                className={cn(
                                  "rounded-[6px] px-3 font-bold border-none",
                                  log.status === "skipped" && "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                                )}
                              >
                                {log.status === "sent" && "مُرسل"}
                                {log.status === "delivered" && "مُستلم"}
                                {log.status === "read" && "مقروء"}
                                {log.status === "failed" && "فشل"}
                                {log.status === "skipped" && "مُستبعد"}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-5">
                              {log.metaMessageId ? (
                                <code className="text-xs bg-muted/50 px-2 py-1 rounded-[6px] font-mono text-muted-foreground">
                                  {log.metaMessageId.slice(-8)}
                                </code>
                              ) : "-"}
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              {log.error ? (
                                <span className="text-destructive text-xs font-bold leading-tight line-clamp-2">{log.error}</span>
                              ) : log.status === "skipped" && log.skipReason ? (
                                <span className="text-yellow-600 text-xs font-bold">
                                  {log.skipReason === "recently_contacted" && "تواصل متكرر سريع"}
                                  {log.skipReason === "rate_limited" && "تجاوز حصة الإرسال"}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Template Details */}
            <Card className="lg:col-span-2 border border-border/50 bg-card rounded-[32px] overflow-hidden">
              <CardHeader className="p-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black">إعدادات المحتوى</CardTitle>
                    <CardDescription className="font-bold">مراجعة بيانات القالب المعتمد لهذه الحملة</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="bg-muted/10 rounded-[24px] p-10 border border-border/30">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <span className="text-2xl font-black text-foreground">{campaign.templateName}</span>
                      <p className="text-sm text-muted-foreground font-medium">WhatsApp Cloud API Template</p>
                    </div>
                    <Badge variant="outline" className="rounded-full px-6 py-2 border-primary/30 text-primary font-black uppercase text-[10px]">Verified Content</Badge>
                  </div>
                  <Separator className="mb-8 border-border/50" />
                  <div className="space-y-6">
                    <p className="text-lg leading-relaxed text-muted-foreground font-medium italic">
                      " يتم جلب محتوى الرسالة وتخصيص المتغيرات (Variables) ديناميكياً لكل عميل لضمان أعلى جودة في التواصل وتجنب الرسائل النمطية. "
                    </p>
                    <div className="flex gap-4">
                      <Button variant="secondary" className="rounded-[12px] font-black h-12 px-6">معاينة القالب الأصلي</Button>
                      <Button variant="outline" className="rounded-[12px] font-black h-12 px-6 border-border/50">تعديل المتغيرات</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Info */}
            <div className="space-y-8">
              <Card className="border border-border/50 bg-card rounded-[32px] overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black">بيانات البنية</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                  {[
                    { label: "معرف الحملة (UUID)", value: String(campaign._id).slice(-12), type: "code" },
                    { label: "تكرار الجدولة (Cron)", value: campaign.recurrenceCronSpec || "تعمل لمرة واحدة", type: "text" },
                    { label: "طبقة الحماية", value: "Smart Shield Active", type: "badge" }
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-border/30 last:border-0">
                      <span className="text-sm font-bold text-muted-foreground">{item.label}</span>
                      {item.type === "code" ? (
                        <code className="text-xs bg-muted px-3 py-1.5 rounded-[8px] font-mono text-primary font-bold">{item.value}</code>
                      ) : item.type === "badge" ? (
                        <Badge className="bg-success/10 text-success border-none font-black text-[10px] rounded-full px-4">{item.value}</Badge>
                      ) : (
                        <span className="text-sm font-black text-foreground">{item.value}</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SearchX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m13.5 8.5-5 5" />
      <path d="m8.5 8.5 5 5" />
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
