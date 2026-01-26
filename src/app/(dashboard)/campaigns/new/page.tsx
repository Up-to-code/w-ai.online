"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowRight,
    Users,
    MessageSquare,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    Tag,
    Smartphone,
    LayoutTemplate,
    ChevronRight,
    ChevronDown,
    Play,
    Shield,
    X,
    Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { CronScheduler } from "@/components/CronScheduler"
import { SchedulePicker } from "@/components/SchedulePicker"
import { TemplatePreview } from "@/components/TemplatePreview"
import { logger } from "@/lib/logger"
import type { Id } from "@convex/_generated/dataModel"

export default function NewCampaignPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)

    // Form Data
    const [name, setName] = useState("")
    const [scheduledAt, setScheduledAt] = useState<string>("")
    const [recurrenceCronSpec, setRecurrenceCronSpec] = useState<string>("")
    const [selectedTemplate, setSelectedTemplate] = useState<{ _id: string; name: string; components?: { type?: string; text?: string }[]; content?: string } | null>(null)
    const [targetAudience, setTargetAudience] = useState<"all" | "tags">("all")
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    // Anti-spam sending config
    const [sendingConfig, setSendingConfig] = useState({
        messagesPerSecond: 10,
        delayBetweenMessages: 100,
        maxRetries: 3,
        skipRecentlyContacted: true,
        recentContactHours: 24,
    })
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

    // Queries
    const templates = useUserQuery(api.templates.list, {})
    const contacts = useUserQuery(api.contacts.list, { limit: 1000 })

    const createCampaign = useUserMutation(api.campaigns.create)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Derived Stats
    const filteredContacts = contacts?.filter((c: any) => {
        if (targetAudience === 'all') return true
        return c.tags?.some((t: any) => selectedTags.includes(t))
    }) || []

    const uniqueTags = Array.from(new Set(contacts?.flatMap((c: any) => c.tags || []) || []))

    const handleSubmit = async () => {
        setIsSubmitting(true)
        try {
            await createCampaign({
                name,
                templateId: selectedTemplate?._id as Id<"templates">,
                templateName: selectedTemplate?.name || "",
                targetTags: targetAudience === 'tags' ? selectedTags : undefined,
                scheduledAt: scheduledAt ? new Date(scheduledAt).getTime() : Date.now(),
                recurrenceCronSpec: recurrenceCronSpec || undefined,
                sendingConfig
            })
            router.push("/campaigns?success=true")
        } catch (error) {
            logger.error("Failed to create campaign:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const steps = [
        { id: 0, title: "التفاصيل", icon: <LayoutTemplate className="h-4 w-4" /> },
        { id: 1, title: "الجمهور", icon: <Users className="h-4 w-4" /> },
        { id: 2, title: "المحتوى", icon: <MessageSquare className="h-4 w-4" /> },
        { id: 3, title: "المراجعة", icon: <CheckCircle2 className="h-4 w-4" /> },
    ]

    return (
        <div className="p-4 sm:p-8 space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-6 border-b border-border/30 pb-8">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push("/campaigns")}
                        className="rounded-[14px] h-12 w-12 bg-muted/20 hover:bg-muted font-black border border-border/50"
                    >
                        <ArrowRight className="h-6 w-6" />
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-foreground">إنشاء حملة احترافية</h1>
                        <p className="text-base text-muted-foreground font-medium">ابدأ الآن بتوسيع نطاق أعمالك عبر WhatsApp بكل سهولة</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full border border-primary/10">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-black text-primary uppercase tracking-widest">المعالج الذكي نشط</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Steps Sidebar */}
                <div className="lg:col-span-3 space-y-3">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-[18px] transition-all duration-500 border-2",
                                currentStep === step.id
                                    ? "bg-primary text-primary-foreground border-primary scale-[1.02] z-10"
                                    : currentStep > step.id
                                        ? "bg-success/5 text-success border-success/20 opacity-90"
                                        : "bg-muted/10 text-muted-foreground border-transparent opacity-40 hover:opacity-60"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-all",
                                currentStep === step.id ? "bg-white/20 rotate-3" : "bg-background/50"
                            )}>
                                {currentStep > step.id ? <CheckCircle2 className="h-6 w-6" /> : step.icon}
                            </div>
                            <span className="font-black text-base tracking-tight">{step.title}</span>
                            {currentStep === step.id && <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                        </div>
                    ))}
                </div>

                {/* Main Form Area */}
                <div className="lg:col-span-9">
                    <Card className="border-2 border-border/50 bg-card rounded-[24px] shadow-none min-h-[600px] overflow-hidden">
                        <CardContent className="p-8">
                            {/* Step 1: Details */}
                            {currentStep === 0 && (
                                <div className="space-y-10 max-w-3xl animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="space-y-3">
                                        <Label className="text-lg font-black tracking-tight">ما هو اسم الحملة؟</Label>
                                        <Input
                                            placeholder="أدخل اسماً يميز هذه الحملة..."
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            className="h-12 text-lg font-black rounded-[14px] bg-muted/5 border-2 border-border/50 px-6 focus:border-primary focus:ring-0 transition-all"
                                            autoFocus
                                        />
                                    </div>

                                    <SchedulePicker
                                        value={scheduledAt}
                                        onChange={(datetime) => setScheduledAt(datetime || "")}
                                        label="متى ترغب في بدء الإرسال؟"
                                    />

                                    {/* Recurrence Section */}
                                    <div className="pt-8 border-t border-border/30 mt-8 space-y-4">
                                        <div
                                            className={cn(
                                                "p-6 border-2 rounded-[24px] cursor-pointer transition-all duration-300 relative overflow-hidden group",
                                                recurrenceCronSpec
                                                    ? 'border-primary bg-primary/5 shadow-none'
                                                    : 'border-border/50 bg-muted/5 hover:border-primary/50'
                                            )}
                                            onClick={() => {
                                                if (!recurrenceCronSpec) setRecurrenceCronSpec("0 9 * * *")
                                            }}
                                        >
                                            <div className="flex items-center gap-4 mb-3">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                    recurrenceCronSpec ? 'border-primary' : 'border-muted-foreground'
                                                )}>
                                                    {recurrenceCronSpec && <div className="w-3 h-3 rounded-full bg-primary" />}
                                                </div>
                                                <div className="flex-1">
                                                    <Label className="cursor-pointer font-black text-xl tracking-tight">تكرار الحملة (اختياري)</Label>
                                                </div>
                                                {recurrenceCronSpec && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setRecurrenceCronSpec("")
                                                        }}
                                                        className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-base text-muted-foreground mr-10 font-medium leading-relaxed">
                                                قم بجدولة هذه الحملة لتعمل بشكل تلقائي لضمان استمرارية التواصل مع عملائك.
                                            </p>
                                        </div>
                                        {recurrenceCronSpec && (
                                            <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                                <CronScheduler value={recurrenceCronSpec} onChange={setRecurrenceCronSpec} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Anti-spam Section */}
                                    <div className="pt-8 border-t border-border/30">
                                        <div className="bg-success/5 border-2 border-success/20 rounded-[24px] p-8 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[16px] bg-success/10 flex items-center justify-center border-2 border-success/10">
                                                        <Shield className="h-6 w-6 text-success" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <span className="text-xl font-black tracking-tight">الحماية من الحظر</span>
                                                        <p className="text-sm text-muted-foreground font-medium">تجنب إرسال رسائل متكررة لنفس المصدر</p>
                                                    </div>
                                                </div>
                                                <Switch
                                                    checked={sendingConfig.skipRecentlyContacted}
                                                    onCheckedChange={(checked) =>
                                                        setSendingConfig(prev => ({ ...prev, skipRecentlyContacted: checked }))
                                                    }
                                                    className="scale-[1.2] data-[state=checked]:bg-success"
                                                />
                                            </div>

                                            {sendingConfig.skipRecentlyContacted && (
                                                <div className="flex items-center gap-4 pr-[64px] animate-in slide-in-from-right-4">
                                                    <Label className="text-base font-black whitespace-nowrap">النافذة الزمنية:</Label>
                                                    <select
                                                        value={sendingConfig.recentContactHours}
                                                        onChange={(e) =>
                                                            setSendingConfig(prev => ({ ...prev, recentContactHours: Number(e.target.value) }))
                                                        }
                                                        className="h-11 px-6 rounded-[12px] border-2 border-success/20 bg-background text-lg font-black outline-none focus:border-success transition-all cursor-pointer"
                                                    >
                                                        <option value={12}>12 ساعة</option>
                                                        <option value={24}>24 ساعة (يوم)</option>
                                                        <option value={48}>48 ساعة (يومان)</option>
                                                        <option value={72}>72 ساعة (3 أيام)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Audience (Clean Standardized) */}
                            {currentStep === 1 && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        {[
                                            {
                                                id: 'all' as const,
                                                title: 'جميع العملاء',
                                                icon: Users,
                                                desc: 'إرسال لجميع جهات الاتصال النشطة.',
                                                badge: `${contacts?.length || 0} مشترك`
                                            },
                                            {
                                                id: 'tags' as const,
                                                title: 'استهداف ذكي',
                                                icon: Tag,
                                                desc: 'تصفية الجمهور حسب اهتماماتهم.',
                                                badge: 'فلاتر مخصصة'
                                            }
                                        ].map((opt) => (
                                            <div
                                                key={opt.id}
                                                className={cn(
                                                    "relative p-8 border-2 rounded-[32px] cursor-pointer transition-all duration-500 overflow-hidden group",
                                                    targetAudience === opt.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-border/50 hover:bg-muted/10 hover:border-primary/30'
                                                )}
                                                onClick={() => setTargetAudience(opt.id)}
                                            >
                                                <div className="relative z-10 text-center space-y-4">
                                                    <div className={cn(
                                                        "w-20 h-20 rounded-[24px] bg-background border-2 flex items-center justify-center mx-auto transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500",
                                                        targetAudience === opt.id ? 'border-primary' : 'border-border/50'
                                                    )}>
                                                        <opt.icon className={cn("h-10 w-10", targetAudience === opt.id ? 'text-primary' : 'text-muted-foreground opacity-50')} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h3 className="text-2xl font-black tracking-tight">{opt.title}</h3>
                                                        <p className="text-muted-foreground text-base font-medium leading-relaxed">{opt.desc}</p>
                                                    </div>
                                                    <div className="inline-flex px-6 py-1.5 rounded-full bg-background border-2 border-border/50 text-lg font-black">
                                                        {opt.badge}
                                                    </div>
                                                </div>
                                                {targetAudience === opt.id && (
                                                    <div className="absolute top-6 left-6 text-primary">
                                                        <CheckCircle2 className="h-8 w-8" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {targetAudience === 'tags' && (
                                        <div className="bg-muted/5 border-2 border-border/50 p-8 rounded-[32px] space-y-6 animate-in zoom-in-95 duration-500">
                                            <Label className="text-xl font-black mb-2 block">تحديد الفئات المستهدفة</Label>
                                            <div className="flex flex-wrap gap-3">
                                                {uniqueTags.map((tag: any) => (
                                                    <Badge
                                                        key={tag}
                                                        className={cn(
                                                            "text-lg py-3 px-6 cursor-pointer transition-all rounded-[14px] border-2 font-black",
                                                            selectedTags.includes(tag)
                                                                ? 'bg-primary text-primary-foreground border-primary'
                                                                : 'bg-background hover:bg-muted border-border/50 text-foreground shadow-none'
                                                        )}
                                                        onClick={() => {
                                                            if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag))
                                                            else setSelectedTags([...selectedTags, tag])
                                                        }}
                                                    >
                                                        {selectedTags.includes(tag) && <CheckCircle2 className="h-5 w-5 ml-2" />}
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-primary/5 border-2 border-primary/10 p-8 rounded-[24px] flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[16px] bg-primary bg-opacity-10 flex items-center justify-center">
                                                <Users className="h-6 w-6 text-primary" />
                                            </div>
                                            <span className="text-xl font-black">قوة الجمهور المختارة:</span>
                                        </div>
                                        <span className="text-4xl font-black tracking-tighter text-primary">
                                            {filteredContacts.length} <span className="text-lg tracking-normal text-muted-foreground mr-2">مستلم</span>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Content (Standardized) */}
                            {currentStep === 2 && (
                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between border-b-2 border-border/30 pb-4">
                                            <Label className="text-2xl font-black tracking-tight text-foreground">القوالب المعتمدة</Label>
                                            <Badge className="bg-success/10 text-success border-none text-[10px] font-black uppercase px-3 py-1 rounded-full">
                                                {templates?.filter((t: any) => t.status === 'APPROVED').length || 0} متاح
                                            </Badge>
                                        </div>

                                        <ScrollArea className="h-[500px] pr-4">
                                            <div className="space-y-4">
                                                {!templates ? (
                                                    [1, 2, 3].map((i) => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-[22px] border-2 border-border/30" />)
                                                ) : (
                                                    templates.filter((t: any) => t.status === 'APPROVED').map((template: any) => (
                                                        <div
                                                            key={template._id}
                                                            className={cn(
                                                                "p-6 border-2 rounded-[22px] cursor-pointer transition-all duration-300 group",
                                                                selectedTemplate?._id === template._id
                                                                    ? 'border-primary bg-primary/5'
                                                                    : 'border-border/50 hover:border-primary/40'
                                                            )}
                                                            onClick={() => setSelectedTemplate(template)}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <h4 className="font-black text-xl group-hover:text-primary transition-colors">{template.name}</h4>
                                                                {selectedTemplate?._id === template._id && <CheckCircle2 className="h-6 w-6 text-primary" />}
                                                            </div>
                                                            <p className="text-base font-medium text-muted-foreground line-clamp-2 leading-relaxed opacity-80">
                                                                {(template.components as any[])?.find(c => c.type === 'BODY')?.text || template.content}
                                                            </p>
                                                            <div className="mt-4 flex gap-2">
                                                                <Badge className="bg-muted text-muted-foreground rounded-lg px-2 py-0.5 font-black text-[9px] uppercase tracking-wider">{template.category}</Badge>
                                                                <Badge className="bg-muted text-muted-foreground rounded-lg px-2 py-0.5 font-black text-[9px] uppercase tracking-wider">{template.language}</Badge>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>

                                    {/* Phone Preview (Cleaner) */}
                                    <div className="flex flex-col items-center justify-center space-y-6">
                                        <div className="bg-muted px-4 py-1.5 rounded-full border border-border/50">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">محاكاة العرض النهائي</span>
                                        </div>
                                        <div className="relative border-slate-950 bg-slate-950 border-[10px] rounded-[2.8rem] h-[580px] w-[290px] shadow-none overflow-visible">
                                            <div className="w-[120px] h-[22px] bg-slate-950 top-[-2px] rounded-b-[18px] left-1/2 -translate-x-1/2 absolute z-20"></div>
                                            <div className="rounded-[2.2rem] overflow-hidden w-full h-full bg-[#E5DDD5] dark:bg-[#0b141a] relative flex flex-col">
                                                {/* Header Mockup */}
                                                <div className="bg-[#075E54] dark:bg-[#202c33] p-4 pt-10 flex items-center gap-3 text-white">
                                                    <ArrowRight className="h-5 w-5" />
                                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                        <Users className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-base font-black truncate">W-AI Official</div>
                                                        <div className="text-[9px] opacity-70 font-black uppercase tracking-widest">Business Account</div>
                                                    </div>
                                                </div>

                                                <div className="flex-1 p-4 overflow-y-auto bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-opacity-20 opacity-90">
                                                    <TemplatePreview
                                                        template={selectedTemplate}
                                                        className="max-w-[95%] shadow-none border border-black/5 rounded-[16px]"
                                                    />
                                                </div>

                                                <div className="p-3 bg-white/10 backdrop-blur-md border-t border-black/5 flex items-center gap-2 mt-auto">
                                                    <div className="flex-1 h-10 bg-white dark:bg-slate-800 rounded-xl px-4 flex items-center">
                                                        <span className="text-slate-400 text-sm font-medium">رد سريع...</span>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-xl bg-[#128C7E] flex items-center justify-center text-white">
                                                        <Send className="h-5 w-5" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Final Review (Refined) */}
                            {currentStep === 3 && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        <div className="space-y-8 p-10 bg-muted/10 rounded-[32px] border-2 border-border/50">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">اسم وهوية الحملة</Label>
                                                <div className="text-3xl font-black text-foreground tracking-tighter leading-tight">{name}</div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">موعد الإرسال</Label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/10">
                                                            <CalendarIcon className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-black leading-none">{scheduledAt ? format(new Date(scheduledAt), "d MMM yyyy", { locale: ar }) : "الآن"}</span>
                                                            <span className="text-sm font-bold text-muted-foreground mt-1">{scheduledAt ? format(new Date(scheduledAt), "p", { locale: ar }) : "إرسال فوري"}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">حجم الجمهور</Label>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-[14px] bg-blue-500/10 flex items-center justify-center text-blue-500 border-2 border-blue-500/10">
                                                            <Users className="h-6 w-6" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-xl font-black leading-none">{filteredContacts.length} مستلم</span>
                                                            <span className="text-sm font-bold text-muted-foreground mt-1 opacity-70">{targetAudience === 'all' ? 'جميع العملاء' : 'فلترة متقدمة'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <Separator className="bg-border/50" />

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-success">
                                                    <Shield className="h-6 w-6" />
                                                    <span className="text-lg font-black tracking-tight">نظام الحماية الذكي نشط</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-[18px] bg-background border-2 border-border/50 flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">السرعة القصوى</span>
                                                        <span className="text-xl font-black">{sendingConfig.messagesPerSecond} / ثانية</span>
                                                    </div>
                                                    <div className="p-4 rounded-[18px] bg-background border-2 border-border/50 flex flex-col gap-1">
                                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">فترة التهدئة</span>
                                                        <span className="text-xl font-black">{sendingConfig.delayBetweenMessages}ms</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-10 bg-muted/5 rounded-[32px] border-2 border-border/50 flex flex-col items-center">
                                            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-8 w-full text-center">المراجعة البصرية للمحتوى</Label>
                                            <div className="w-full flex justify-center">
                                                <TemplatePreview template={selectedTemplate} className="max-w-full shadow-none border-2 border-border/30 rounded-[24px] bg-background" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Final Step Action Button (Refined) */}
                            <div className="flex justify-between items-center pt-8 border-t-2 border-border/30 mt-12">
                                <Button
                                    variant="ghost"
                                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                                    disabled={currentStep === 0}
                                    className="h-12 px-8 rounded-[16px] font-black text-xl text-muted-foreground hover:bg-muted"
                                >
                                    سابق
                                </Button>

                                {currentStep < 3 ? (
                                    <Button
                                        onClick={() => setCurrentStep(currentStep + 1)}
                                        disabled={
                                            (currentStep === 0 && !name) ||
                                            (currentStep === 1 && filteredContacts.length === 0) ||
                                            (currentStep === 2 && !selectedTemplate)
                                        }
                                        className="h-12 px-10 rounded-[16px] font-black text-xl gap-3 bg-foreground text-background hover:bg-foreground/90 transition-all active:scale-95"
                                    >
                                        استمرار <ArrowRight className="h-5 w-5 rotate-180" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        className="h-14 px-12 rounded-[18px] font-black text-2xl gap-3 bg-primary text-white hover:bg-primary/90 transition-all shadow-none active:scale-95"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "جاري المعالجة..." : scheduledAt ? "تثبيت الجدولة" : "إطلاق الحملة الآن"}
                                        {!isSubmitting && <CheckCircle2 className="h-6 w-6" />}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
