"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Zap,
    Plus,
    MessageSquare,
    Tag,
    Bell,
    Send,
    Clock,
    Play,
    Trash,
    Edit,
    ChevronDown,
    Save,
    ArrowRight,
    UserPlus,
    Users,
    X,
    Settings2,
    CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const TRIGGERS = [
    { value: "new_message", label: "رسالة جديدة", icon: MessageSquare, description: "يتم التشغيل عند استلام أي رسالة جديدة" },
    { value: "contact_created", label: "عميل جديد", icon: Users, description: "يتم التشغيل عند إضافة عميل جديد للنظام" },
    { value: "keyword", label: "كلمة مفتاحية", icon: Tag, description: "يتم التشغيل عندما تحتوي الرسالة على كلمة محددة" },
    { value: "tag_added", label: "إضافة وسم", icon: Tag, description: "يتم التشغيل عند إضافة وسم معين لعميل" },
]

const ACTION_TYPES = [
    { value: "send_template", label: "إرسال قالب", icon: Send, description: "إرسال قالب واتساب معتمد للعميل" },
    { value: "add_tag", label: "إضافة وسم", icon: Tag, description: "إضافة وسم تصنيفي للعميل" },
    { value: "remove_tag", label: "إزالة وسم", icon: Trash, description: "إزالة وسم موجود من العميل" },
    { value: "delay", label: "انتظار (تأخير)", icon: Clock, description: "تأجيل الخطوة التالية لفترة زمنية محددة" },
    { value: "assign_user", label: "تعيين موظف", icon: UserPlus, description: "إسناد المحادثة لموظف محدد" },
    { value: "notify", label: "إرسال تنبيه", icon: Bell, description: "إرسال تنبيه داخلي للفريق" },
]

interface Step {
    type: string
    config: any
}

interface WorkflowBuilderProps {
    workflowId?: string
}

export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
    const router = useRouter()
    const { userId } = useUserContext()
    const { currentOrganization } = useOrganizationContext()
    const organizationId = currentOrganization?._id

    const existingWorkflow = useQuery(
        api.workflows.getById,
        workflowId && organizationId ? { id: workflowId as any, organizationId } : "skip"
    )

    const templates = useQuery(api.templates.list, userId ? { userId } : "skip") || []
    const members = useQuery(api.organizations.getMembers, organizationId ? { organizationId } : "skip") || []

    const createWorkflow = useMutation(api.workflows.create)
    const updateWorkflow = useMutation(api.workflows.update)

    const [name, setName] = useState("أتمتة جديدة")
    const [trigger, setTrigger] = useState("new_message")
    const [triggerConfig, setTriggerConfig] = useState<any>({})
    const [steps, setSteps] = useState<Step[]>([])
    const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Load existing workflow
    useEffect(() => {
        if (existingWorkflow) {
            setName(existingWorkflow.name)
            setTrigger(existingWorkflow.trigger)
            setTriggerConfig(existingWorkflow.triggerConfig || {})
            setSteps(existingWorkflow.steps || [])
        }
    }, [existingWorkflow])

    const addStep = (type: string) => {
        const newStep = { type, config: {} }
        setSteps([...steps, newStep])
        setActiveStepIndex(steps.length)
    }

    const removeStep = (index: number) => {
        const newSteps = [...steps]
        newSteps.splice(index, 1)
        setSteps(newSteps)
        if (activeStepIndex === index) setActiveStepIndex(null)
    }

    const updateStepConfig = (index: number, config: any) => {
        const newSteps = [...steps]
        newSteps[index].config = { ...newSteps[index].config, ...config }
        setSteps(newSteps)
    }

    const handleSave = async () => {
        if (!userId) return
        setIsSaving(true)
        try {
            if (workflowId) {
                await updateWorkflow({
                    id: workflowId as any,
                    userId,
                    name,
                    trigger,
                    triggerConfig,
                    steps
                })
                toast.success("تم تحديث الأتمتة بنجاح")
            } else {
                await createWorkflow({
                    userId,
                    name,
                    trigger,
                    triggerConfig,
                    steps
                })
                toast.success("تم إنشاء الأتمتة بنجاح")
                router.push("/workflows")
            }
        } catch (error) {
            toast.error("فشل حفظ الأتمتة")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50 dark:bg-slate-950/20" dir="rtl">
            {/* Main Canvas Area */}
            <div className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-2xl mx-auto space-y-8 pb-32">
                    {/* Header Info */}
                    <div className="flex items-center justify-between bg-card p-6 rounded-3xl border shadow-sm border-slate-200/60 dark:border-slate-800/60">
                        <div className="space-y-1">
                            <Input
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="text-xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 h-auto"
                                placeholder="اسم الأتمتة..."
                            />
                            <p className="text-sm text-muted-foreground">صمم مسار العمل التلقائي الخاص بك</p>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || steps.length === 0}
                            className="rounded-full px-6 shadow-lg shadow-primary/20"
                        >
                            {isSaving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
                            <Save className="mr-2 h-4 w-4" />
                        </Button>
                    </div>

                    {/* Trigger Card */}
                    <div className="relative group">
                        <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-warning flex items-center justify-center text-white font-bold text-xs shadow-lg z-10 transition-transform group-hover:scale-110">
                            1
                        </div>
                        <Card className={cn(
                            "rounded-3xl border-2 transition-all cursor-pointer",
                            activeStepIndex === -1 ? "border-warning ring-4 ring-warning/10" : "border-slate-200/60 dark:border-slate-800/60 hover:border-warning/50"
                        )} onClick={() => setActiveStepIndex(-1)}>
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                                    <Zap className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">عندما يحدث (المشغّل)</CardTitle>
                                    <CardDescription>بداية مسار العمل</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                                {TRIGGERS.find(t => t.value === trigger)?.icon &&
                                                    (() => {
                                                        const Icon = TRIGGERS.find(t => t.value === trigger)!.icon
                                                        return <Icon className="h-5 w-5 text-warning" />
                                                    })()
                                                }
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm">{TRIGGERS.find(t => t.value === trigger)?.label}</p>
                                                <p className="text-xs text-muted-foreground">{TRIGGERS.find(t => t.value === trigger)?.description}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20">تعديل الإعدادات</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Steps Chain */}
                    {steps.map((step, index) => {
                        const stepInfo = ACTION_TYPES.find(a => a.value === step.type)
                        const Icon = stepInfo?.icon || Play
                        const isActive = activeStepIndex === index

                        return (
                            <div key={index} className="relative group animate-in fade-in slide-in-from-top-4 duration-300">
                                {/* Connector Line */}
                                <div className="absolute top-[-32px] right-1/2 translate-x-1/2 w-0.5 h-8 bg-slate-200 dark:bg-slate-800" />

                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-success flex items-center justify-center text-white font-bold text-xs shadow-lg z-10 transition-transform group-hover:scale-110">
                                    {index + 2}
                                </div>

                                <Card className={cn(
                                    "rounded-3xl border-2 transition-all cursor-pointer",
                                    isActive ? "border-success ring-4 ring-success/10" : "border-slate-200/60 dark:border-slate-800/60 hover:border-success/50"
                                )} onClick={() => setActiveStepIndex(index)}>
                                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                        <div className="p-3 rounded-2xl bg-success/10 text-success">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-lg">{stepInfo?.label}</CardTitle>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => { e.stopPropagation(); removeStep(index); }}
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <CardDescription>{stepInfo?.description}</CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50">
                                            {/* Step Summary View */}
                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {step.type === "send_template" && (step.config?.template ? `إرسال القالب: ${step.config.template}` : "لم يتم اختيار قالب")}
                                                {step.type === "add_tag" && (step.config?.tag ? `إضافة الوسم: ${step.config.tag}` : "لم يتم تحديد وسم")}
                                                {step.type === "remove_tag" && (step.config?.tag ? `إزالة الوسم: ${step.config.tag}` : "لم يتم تحديد وسم")}
                                                {step.type === "delay" && `انتظار لمدة ${step.config.duration || 60} ${step.config.unit === 'hours' ? 'ساعة' : step.config.unit === 'days' ? 'يوم' : 'دقيقة'}`}
                                                {step.type === "notify" && (step.config?.message ? `التنبيه: ${step.config.message}` : "لم يتم كتابة رسالة")}
                                                {step.type === "assign_user" && "إسناد لموظف محدد"}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )
                    })}

                    {/* Add Step Button */}
                    <div className="flex flex-col items-center pt-4">
                        <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-800 mb-2" />
                        <Card className="rounded-full p-2 border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-primary transition-all group cursor-pointer pr-4 pl-4" onClick={() => setActiveStepIndex(999)}>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:rotate-90">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">إضافة خطوة جديدة</span>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Sidebar Inspector Area */}
            <div className="w-96 border-r border-slate-200/60 dark:border-slate-800/60 bg-card overflow-y-auto">
                <div className="p-6 space-y-8">
                    {activeStepIndex === -1 ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center gap-2 text-warning mb-2">
                                <Zap className="h-5 w-5" />
                                <h3 className="text-lg font-bold">إعدادات المشغّل</h3>
                            </div>

                            <div className="space-y-4">
                                <Label>نوع المشغّل</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {TRIGGERS.map(t => {
                                        const TIcon = t.icon
                                        return (
                                            <div
                                                key={t.value}
                                                className={cn(
                                                    "p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3",
                                                    trigger === t.value ? "border-warning bg-warning/5" : "hover:bg-slate-50 dark:hover:bg-slate-900 border-transparent"
                                                )}
                                                onClick={() => setTrigger(t.value)}
                                            >
                                                <div className={cn("p-2 rounded-xl", trigger === t.value ? "bg-warning text-white" : "bg-slate-100 dark:bg-slate-800")}>
                                                    <TIcon className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-sm">{t.label}</span>
                                                {trigger === t.value && <CheckCircle2 className="h-4 w-4 text-warning mr-auto" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {trigger === "keyword" && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <Label>الكلمة المفتاحية</Label>
                                    <Input
                                        placeholder="مثال: سعر، مساعدة..."
                                        value={triggerConfig.keyword || ""}
                                        onChange={e => setTriggerConfig({ ...triggerConfig, keyword: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            )}

                            {trigger === "tag_added" && (
                                <div className="space-y-2 animate-in fade-in duration-300">
                                    <Label>الوسم المفعل</Label>
                                    <Input
                                        placeholder="مثال: VIP، مهتم..."
                                        value={triggerConfig.tag || ""}
                                        onChange={e => setTriggerConfig({ ...triggerConfig, tag: e.target.value })}
                                        className="rounded-xl"
                                    />
                                </div>
                            )}
                        </div>
                    ) : activeStepIndex === 999 ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                            <div className="flex items-center gap-2 text-primary">
                                <Plus className="h-5 w-5" />
                                <h3 className="text-lg font-bold">إضافة خطوة</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {ACTION_TYPES.map(a => {
                                    const AIcon = a.icon
                                    return (
                                        <Card
                                            key={a.value}
                                            className="rounded-2xl border hover:border-primary/50 cursor-pointer transition-all group"
                                            onClick={() => addStep(a.value)}
                                        >
                                            <CardContent className="p-4 flex items-center gap-3">
                                                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <AIcon className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm">{a.label}</p>
                                                    <p className="text-[10px] text-muted-foreground">{a.description}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    ) : activeStepIndex !== null ? (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-300" key={activeStepIndex}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-success">
                                    <Settings2 className="h-5 w-5" />
                                    <h3 className="text-lg font-bold">إعدادات الخطوة</h3>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setActiveStepIndex(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <Separator />

                            {/* Configuration Forms based on type */}
                            <div className="space-y-4">
                                {steps[activeStepIndex].type === "send_template" && (
                                    <div className="space-y-4">
                                        <Label>اختر قالب واتساب</Label>
                                        <Select
                                            value={steps[activeStepIndex].config.template || ""}
                                            onValueChange={v => updateStepConfig(activeStepIndex, { template: v })}
                                        >
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="اختر قالب..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {templates.filter((t: any) => t.status === "APPROVED").map((t: any) => (
                                                    <SelectItem key={t._id} value={t.name}>{t.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">اقتراح: استخدم القوالب المعتمدة لتجنب حظر الحساب.</p>
                                    </div>
                                )}

                                {(steps[activeStepIndex].type === "add_tag" || steps[activeStepIndex].type === "remove_tag") && (
                                    <div className="space-y-4">
                                        <Label>اسم الوسم</Label>
                                        <Input
                                            placeholder="أدخل اسم الوسم..."
                                            value={steps[activeStepIndex].config.tag || ""}
                                            onChange={e => updateStepConfig(activeStepIndex, { tag: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                )}

                                {steps[activeStepIndex].type === "delay" && (
                                    <div className="space-y-4">
                                        <Label>مدة الانتظار</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={steps[activeStepIndex].config.duration || 60}
                                                onChange={e => updateStepConfig(activeStepIndex, { duration: parseInt(e.target.value) })}
                                                className="rounded-xl flex-1"
                                            />
                                            <Select
                                                value={steps[activeStepIndex].config.unit || "minutes"}
                                                onValueChange={v => updateStepConfig(activeStepIndex, { unit: v })}
                                            >
                                                <SelectTrigger className="rounded-xl w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="minutes">دقائق</SelectItem>
                                                    <SelectItem value="hours">ساعات</SelectItem>
                                                    <SelectItem value="days">أيام</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                )}

                                {steps[activeStepIndex].type === "notify" && (
                                    <div className="space-y-4">
                                        <Label>نص التنبيه</Label>
                                        <textarea
                                            placeholder="أدخل نص التنبيه الموجه للفريق..."
                                            className="w-full h-24 p-3 rounded-xl border bg-background text-sm resize-none"
                                            value={steps[activeStepIndex].config.message || ""}
                                            onChange={e => updateStepConfig(activeStepIndex, { message: e.target.value })}
                                        />
                                    </div>
                                )}

                                {steps[activeStepIndex].type === "assign_user" && (
                                    <div className="space-y-4">
                                        <Label>اختر الموظف لإسناد المحادثة له</Label>
                                        <Select
                                            value={steps[activeStepIndex].config.userId || ""}
                                            onValueChange={v => updateStepConfig(activeStepIndex, { userId: v })}
                                        >
                                            <SelectTrigger className="rounded-xl">
                                                <SelectValue placeholder="اختر موظف..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {members.map((u: any) => (
                                                    <SelectItem key={u._id} value={u._id}>{u.name || u.email}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-muted-foreground">
                            <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                                <Settings2 className="h-8 w-8 opacity-20" />
                            </div>
                            <p className="text-sm font-medium">حدد خطوة من Canvas للبدء في تعديل إعداداتها</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

