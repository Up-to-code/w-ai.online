"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/ui/stat-card"
import {
  Plus,
  Search,
  MessageSquare,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  Calendar as CalendarIcon,
  Play
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns"
import { ar } from "date-fns/locale"
import type { Id } from "@convex/_generated/dataModel"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logger } from "@/lib/logger"

export default function CampaignsPage() {
  const campaigns = useUserQuery(api.campaigns.list, {})
  const templates = useUserQuery(api.templates.list, {})
  const removeCampaign = useUserMutation(api.campaigns.remove)
  const createCampaign = useUserMutation(api.campaigns.create)
  const [searchQuery, setSearchQuery] = useState("")
  const [view, setView] = useState<"list" | "calendar">("list")
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  const calendarDays = useMemo(() => {
    const startMonth = startOfMonth(currentMonth)
    const endMonthDate = endOfMonth(currentMonth)
    const startDate = startOfWeek(startMonth, { locale: ar })
    const endDate = endOfWeek(endMonthDate, { locale: ar })
    const days: Date[] = []
    let day = startDate
    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
      days.push(day) // Double push bug in loop? No, day updated before push? Wait.
      // Correct loop:
      // day = startDate
      // while day <= endDate
      //   push day
      //   day = addDays(day, 1)
      // My previous code:
      // days.push(day)
      // day = addDays(day, 1)
    }
    // Let's rewrite the loop properly
    const d = []
    let curr = startDate
    while (curr <= endDate) {
      d.push(curr)
      curr = addDays(curr, 1)
    }
    return d
  }, [currentMonth])

  const stats = useMemo(() => {
    if (!campaigns) return {
      total: 0,
      sent: 0,
      readRate: 0,
      deliveredRate: 0,
      sentTrend: 0,
      deliveredRateTrend: 0,
      readRateTrend: 0
    }

    const now = Date.now()
    const currentPeriodStart = now - (7 * 24 * 60 * 60 * 1000) // Last 7 days
    const previousPeriodStart = now - (14 * 24 * 60 * 60 * 1000) // 7-14 days ago
    const previousPeriodEnd = currentPeriodStart

    // Current period campaigns
    const currentCampaigns = campaigns.filter((c: any) => c.createdAt >= currentPeriodStart)
    const currentSent = currentCampaigns.reduce((acc: number, c: any) => acc + (c.stats.sent || 0), 0)
    const currentDelivered = currentCampaigns.reduce((acc: number, c: any) => acc + (c.stats.delivered || 0), 0)
    const currentRead = currentCampaigns.reduce((acc: number, c: any) => acc + (c.stats.read || 0), 0)
    const currentDeliveredRate = currentSent > 0 ? (currentDelivered / currentSent) * 100 : 0
    const currentReadRate = currentDelivered > 0 ? (currentRead / currentDelivered) * 100 : 0

    // Previous period campaigns
    const previousCampaigns = campaigns.filter((c: any) =>
      c.createdAt >= previousPeriodStart && c.createdAt < previousPeriodEnd
    )
    const previousSent = previousCampaigns.reduce((acc: number, c: any) => acc + (c.stats.sent || 0), 0)
    const previousDelivered = previousCampaigns.reduce((acc: number, c: any) => acc + (c.stats.delivered || 0), 0)
    const previousRead = previousCampaigns.reduce((acc: number, c: any) => acc + (c.stats.read || 0), 0)
    const previousDeliveredRate = previousSent > 0 ? (previousDelivered / previousSent) * 100 : 0
    const previousReadRate = previousDelivered > 0 ? (previousRead / previousDelivered) * 100 : 0

    // Calculate trends
    const sentTrend = previousSent > 0
      ? ((currentSent - previousSent) / previousSent) * 100
      : (currentSent > 0 ? 100 : 0)
    const deliveredRateTrend = previousDeliveredRate > 0
      ? currentDeliveredRate - previousDeliveredRate
      : (currentDeliveredRate > 0 ? currentDeliveredRate : 0)
    const readRateTrend = previousReadRate > 0
      ? currentReadRate - previousReadRate
      : (currentReadRate > 0 ? currentReadRate : 0)

    // Overall stats (all time)
    const total = campaigns.length
    const sent = campaigns.reduce((acc: number, c: any) => acc + (c.stats.sent || 0), 0)
    const totalDelivered = campaigns.reduce((acc: number, c: any) => acc + (c.stats.delivered || 0), 0)
    const totalRead = campaigns.reduce((acc: number, c: any) => acc + (c.stats.read || 0), 0)

    return {
      total,
      sent,
      readRate: totalDelivered > 0 ? Math.round((totalRead / totalDelivered) * 100) : 0,
      deliveredRate: sent > 0 ? Math.round((totalDelivered / sent) * 100) : 0,
      sentTrend,
      deliveredRateTrend,
      readRateTrend
    }
  }, [campaigns])


  const handleDelete = async (id: Id<"campaigns">) => {
    try {
      await removeCampaign({ id })
    } catch (e) {
      logger.error("Failed to delete campaign", e)
    }
  }

  return (
    <div className="space-y-10 p-6 sm:p-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">الحملات التسويقية</h1>
          <p className="text-base text-muted-foreground font-medium">أداة احترافية لإدارة وتوسيع نطاق تواصلك عبر WhatsApp</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-muted/30 p-1 rounded-[14px] flex items-center border border-border/50">
            <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
              <TabsList className="bg-transparent p-0 gap-1">
                <TabsTrigger value="list" className="rounded-[10px] px-6 h-9 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white">قائمة</TabsTrigger>
                <TabsTrigger value="calendar" className="rounded-[10px] px-6 h-9 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white">تقويم</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Link href="/campaigns/new">
            <Button className="gap-2 bg-primary hover:bg-primary/95 text-white rounded-[14px] h-12 px-8 font-black shadow-none border-none">
              <Plus className="h-5 w-5" />
              حملة جديدة
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "إجمالي الحملات", value: stats.total, icon: MessageSquare, color: "text-primary/70 bg-primary/5" },
          {
            title: "رسائل مرسلة",
            value: stats.sent.toLocaleString(),
            icon: CheckCircle2,
            color: "text-success/70 bg-success/5",
          },
          {
            title: "معدل الوصول",
            value: `${stats.deliveredRate}%`,
            icon: Users,
            color: "text-blue-500/70 bg-blue-500/5",
          },
          {
            title: "معدل القراءة",
            value: `${stats.readRate}%`,
            icon: BarChart3,
            color: "text-white/80 bg-white/20",
            variant: "primary",
          }
        ].map((stat, i) => (
          <Card key={i} className={cn(
            "border border-border/50 bg-card rounded-[20px] shadow-none overflow-hidden",
            stat.variant === "primary" && "bg-primary text-white border-primary"
          )}>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-3xl font-black tracking-tighter leading-none">{stat.value || 0}</p>
                  <p className={cn("text-[10px] font-black uppercase tracking-widest", stat.variant === "primary" ? "text-white/60" : "text-muted-foreground/60")}>
                    {stat.title}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {view === "list" && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="relative w-full sm:max-w-md group">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="بحث في الحملات..."
                  className="pl-4 pr-12 bg-muted/20 border-border/50 rounded-[14px] h-12 font-bold text-base focus:ring-primary/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground bg-muted/10 px-4 py-2 rounded-full border border-border/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                {campaigns?.length || 0} حملة مسجلة
              </div>
            </div>

            {!campaigns ? (
              <div className="grid grid-cols-1 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 rounded-[28px] bg-muted/20 animate-pulse border border-border/30" />
                ))}
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-[24px] border-2 border-dashed border-border/50 hover:bg-muted/5 transition-colors">
                <div className="w-24 h-24 bg-primary/5 rounded-[28px] flex items-center justify-center mb-6 border-2 border-primary/10">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-foreground tracking-tight">ابدأ حملتك الأولى</h3>
                <p className="text-muted-foreground text-base max-w-sm mb-8 font-medium leading-relaxed">
                  حول التواصل مع عملائك إلى تجربة ذكية ومؤثرة من خلال قوالب WhatsApp المعتمدة.
                </p>
                <Link href="/campaigns/new">
                  <Button size="lg" className="rounded-[16px] px-10 h-12 font-black text-lg shadow-none gap-2">
                    <Plus className="h-5 w-5" />
                    إنشاء أول حملة
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {campaigns
                  .filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((campaign: any) => (
                    <Card key={campaign._id} className="p-0 overflow-hidden border border-border/50 shadow-none hover:bg-muted/10 transition-all rounded-[20px] group">
                      <div className="p-6 flex flex-col xl:flex-row xl:items-center gap-8">
                        {/* Icon & Name */}
                        <div className="flex items-center gap-5 flex-1">
                          <div className={cn(
                            "w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 transition-all group-hover:scale-110 group-hover:rotate-3 duration-500",
                            campaign.status === 'COMPLETED' ? 'bg-success/10 text-success' :
                              campaign.status === 'PROCESSING' ? 'bg-primary/10 text-primary shadow-lg shadow-primary/5' :
                                campaign.status === 'FAILED' ? 'bg-destructive/10 text-destructive' :
                                  'bg-muted/50 text-muted-foreground'
                          )}>
                            {campaign.status === 'PROCESSING' ? (
                              <div className="relative flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-primary"></span>
                              </div>
                            ) : (
                              <MessageSquare className="h-6 w-6" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <Link href={`/campaigns/${campaign._id}`} className="font-black text-xl hover:text-primary transition-colors tracking-tight">
                                {campaign.name}
                              </Link>
                              <Badge variant={
                                campaign.status === 'COMPLETED' ? 'secondary' :
                                  campaign.status === 'PROCESSING' ? 'default' :
                                    campaign.status === 'FAILED' ? 'destructive' : 'outline'
                              } className="rounded-[6px] font-black px-2.5 py-0.5 uppercase text-[9px] tracking-widest border-none">
                                {campaign.status === 'COMPLETED' ? 'مكتملة' :
                                  campaign.status === 'PROCESSING' ? 'جاري التنفيذ' :
                                    campaign.status === 'FAILED' ? 'فشلت' : campaign.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-8 text-sm text-muted-foreground font-black uppercase tracking-widest opacity-60">
                              <span className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                {format(campaign.createdAt, "d MMM yyyy", { locale: ar })}
                              </span>
                              <span className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {campaign.stats.total} مستلم
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mini Stats */}
                        <div className="flex items-center gap-12 text-sm lg:mr-auto px-8 border-x border-border/30">
                          <div className="text-center space-y-1">
                            <div className="font-black text-2xl text-foreground tracking-tighter">{campaign.stats.sent}</div>
                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">مُرسل</div>
                          </div>
                          <div className="text-center space-y-1">
                            <div className="font-black text-2xl text-primary tracking-tighter">
                              {campaign.stats.delivered > 0
                                ? `${Math.round((campaign.stats.read / campaign.stats.delivered) * 100)}%`
                                : "0%"
                              }
                            </div>
                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">تفاعل</div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          <Link href={`/campaigns/${campaign._id}`}>
                            <Button variant="secondary" className="rounded-[12px] px-6 h-10 font-black bg-muted/40 hover:bg-muted text-foreground transition-all group-hover:bg-primary group-hover:text-white">
                              تحليل
                              <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-[-4px] transition-transform" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-[12px] h-10 w-10 text-muted-foreground hover:bg-muted">
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-[18px] border-border/50 p-2 min-w-[180px]">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive cursor-pointer font-black rounded-[12px] h-12 p-4"
                                onClick={() => handleDelete(campaign._id as Id<"campaigns">)}
                                disabled={campaign.status === 'PROCESSING'}
                              >
                                <Trash2 className="h-5 w-5 ml-3" />
                                حذف الحملة نهائياً
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Progress Bar for Processing */}
                      {campaign.status === 'PROCESSING' && (
                        <div className="h-2 w-full bg-muted/10 relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(campaign.stats.sent / Math.max(1, campaign.stats.total)) * 100}%` }}
                            className="h-full bg-primary relative"
                          >
                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] skew-x-[-30deg]" />
                          </motion.div>
                        </div>
                      )}
                    </Card>
                  ))}
              </div>
            )}
          </>
        )}

        {view === "calendar" && (
          <div className="bg-card rounded-[20px] border border-border/50 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-muted/30 rounded-[12px] flex border border-border/50 overflow-hidden">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="rounded-none border-l border-border/50 h-9 w-9">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="px-5 py-2 font-black min-w-[140px] text-center text-foreground text-sm">
                    {format(currentMonth, "MMMM yyyy", { locale: ar })}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="rounded-none border-r border-border/50 h-9 w-9">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs font-bold py-1.5 px-4 rounded-full bg-primary/5 text-primary border-none">
                {campaigns?.length || 0} حملات مجدولة
              </Badge>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border/50 rounded-[20px] overflow-hidden border border-border/50 shadow-none">
              {["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].map((d) => (
                <div key={d} className="bg-muted/50 p-4 text-center text-[11px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/50">{d}</div>
              ))}
              {calendarDays.map((day, i) => {
                const dayCampaigns = (campaigns || []).filter((c: any) => isSameDay(new Date(c.scheduledAt), day))
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[160px] bg-card p-4 transition-all hover:bg-muted/20 relative",
                      !isCurrentMonth && 'bg-muted/5 opacity-40'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn(
                        "text-sm font-black w-8 h-8 flex items-center justify-center rounded-[10px] transition-colors",
                        isToday ? 'bg-primary text-white' : 'text-muted-foreground'
                      )}>
                        {format(day, "d")}
                      </span>
                      {dayCampaigns.length > 0 && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-2">
                      {dayCampaigns.map((c: any) => (
                        <Link key={c._id} href={`/campaigns/${c._id}`}>
                          <div className={cn(
                            "text-[11px] p-2.5 rounded-[10px] border font-bold truncate transition-all hover:translate-y-[-2px] active:scale-95 cursor-pointer shadow-none",
                            c.status === 'COMPLETED' ? 'bg-success/5 border-success/30 text-success' :
                              c.status === 'PROCESSING' ? 'bg-primary/5 border-primary/20 text-primary' :
                                'bg-muted/50 border-border/50 text-foreground'
                          )}>
                            {c.name}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}