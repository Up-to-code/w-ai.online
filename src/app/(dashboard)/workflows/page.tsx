"use client"

import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Zap,
    Plus,
    Clock,
    Play,
    Trash,
    Edit,
    MoreVertical,
    History,
    ChevronLeft
} from "lucide-react"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import Link from "next/link"
import { FlowPreview } from "@/components/FlowPreview"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const TRIGGERS: Record<string, string> = {
    new_message: "رسالة جديدة",
    contact_created: "عميل جديد",
    keyword: "كلمة مفتاحية",
    tag_added: "إضافة وسم",
}

export default function WorkflowsPage() {
    const { currentOrganization } = useOrganizationContext()
    const workflows = useUserQuery(api.workflows.list, {}) || []
    const toggleWorkflowMutation = useUserMutation(api.workflows.toggle)
    const deleteWorkflow = useUserMutation(api.workflows.remove)

    const toggleWorkflow = async (id: string) => {
        await toggleWorkflowMutation({ id: id as any })
    }

    return (
        <div className="space-y-8 m-16" dir="rtl">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">الأتمتة</h1>
                    <p className="text-muted-foreground text-sm mt-1">قم بأتمتة محادثاتك وسير العمل بذكاء</p>
                </div>
                <Link href="/workflows/new">
                    <Button className="gap-2 rounded-full px-6">
                        <Plus className="h-4 w-4" />
                        إنشاء سير عمل
                    </Button>
                </Link>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "إجمالي القواعد", value: workflows.length, icon: Zap, color: "text-primary bg-primary/10" },
                    { label: "القواعد النشطة", value: workflows.filter((w: any) => w.enabled).length, icon: Play, color: "text-success bg-success/10" },
                    { label: "إجمالي التنفيذات", value: workflows.reduce((sum: number, w: any) => sum + (w.stats?.runs || 0), 0), icon: History, color: "text-info bg-info/10" }
                ].map((stat, i) => (
                    <Card key={i} className="border-none bg-card rounded-[16px] overflow-hidden group">
                        <CardContent className="flex items-center gap-5 pt-8 pb-8">
                            <div className={cn("w-14 h-14 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110 duration-300", stat.color)}>
                                <stat.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-foreground">{stat.value}</p>
                                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Workflow Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6 pb-20">
                {workflows.map((workflow: any) => (
                    <Card key={workflow._id} className={cn(
                        "group border-2 transition-all duration-300 rounded-[16px] overflow-hidden hover:border-primary/20",
                        !workflow.enabled ? "opacity-70 bg-slate-50/50 grayscale-[0.5]" : "bg-card"
                    )}>
                        <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="space-y-1 pr-2 flex-1">
                                <div className="flex items-center gap-3">
                                    <CardTitle className="text-xl font-bold">{workflow.name}</CardTitle>
                                    {!workflow.enabled && <Badge variant="secondary" className="text-[10px] font-bold">معطل</Badge>}
                                </div>
                                <CardDescription className="text-xs line-clamp-1">
                                    {TRIGGERS[workflow.trigger] || workflow.trigger}
                                    {workflow.triggerConfig?.keyword && ` • "${workflow.triggerConfig.keyword}"`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={workflow.enabled}
                                    onCheckedChange={() => toggleWorkflow(workflow._id)}
                                    className="data-[state=checked]:bg-success"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-[16px]">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/workflows/${workflow._id}`} className="flex items-center gap-2 cursor-pointer">
                                                <Edit className="h-4 w-4" />
                                                <span>تعديل</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => deleteWorkflow({ id: workflow._id })}
                                            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                                        >
                                            <Trash className="h-4 w-4" />
                                            <span>حذف</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-4">
                            {/* Visual Flow Preview */}
                            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-5 rounded-[16px] border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    <span>المسار التلقائي</span>
                                    <span>{workflow.steps?.length || 0} خطوات</span>
                                </div>
                                <FlowPreview trigger={workflow.trigger} steps={workflow.steps || []} />
                            </div>

                            {/* Detailed Stats Row */}
                            <div className="flex items-center justify-between text-sm pt-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Play className="h-3.5 w-3.5" />
                                        <span className="font-bold">{workflow.stats?.runs || 0}</span>
                                        <span className="text-xs font-medium">مرة</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-xs font-medium">آخر نشاط:</span>
                                        <span className="text-xs font-bold">
                                            {workflow.stats?.lastRun ? new Date(workflow.stats.lastRun).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) : '-'}
                                        </span>
                                    </div>
                                </div>
                                <Link href={`/workflows/${workflow._id}`}>
                                    <Button variant="ghost" size="sm" className="h-8 rounded-full text-primary hover:text-primary hover:bg-primary/10 gap-1 pr-3 pl-3">
                                        تعديل المسار
                                        <ChevronLeft className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {workflows.length === 0 && (
                    <div className="col-span-full h-96 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                            <Zap className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold">لا يوجد مسارات عمل حتى الآن</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">ابدأ بإنشاء أول قاعدة أتمتة لتبدأ بتقديم خدمة عملاء أسرع بذكاء واتساب</p>
                        </div>
                        <Link href="/workflows/new">
                            <Button className="rounded-full px-8">ابدأ الآن</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
