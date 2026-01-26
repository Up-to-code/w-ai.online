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
        <div className="p-6 sm:p-10 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500" dir="rtl">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-foreground tracking-tight">الأتمتة</h1>
                    <p className="text-lg text-muted-foreground font-medium">قم بأتمتة محادثاتك وسير العمل بذكاء</p>
                </div>
                <Link href="/workflows/new" className="w-full sm:w-auto">
                    <Button className="w-full h-12 px-8 gap-2 bg-primary hover:bg-primary/90 rounded-[14px] font-black transform transition-all hover:-translate-y-0.5 active:translate-y-0">
                        <Plus className="h-5 w-5" />
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
                    <Card key={i} className="border border-border/50 bg-card hover:bg-slate-50/50 transition-all rounded-[24px] overflow-hidden group">
                        <CardContent className="flex items-center gap-6 pt-8 pb-8 px-8">
                            <div className={cn("w-14 h-14 rounded-[16px] flex items-center justify-center transition-transform group-hover:scale-110 duration-500", stat.color)}>
                                <stat.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Workflow Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {workflows.map((workflow: any) => (
                    <Card key={workflow._id} className={cn(
                        "group border border-border/50 transition-all duration-300 rounded-[24px] overflow-hidden hover:bg-muted/10 hover:border-primary/20 bg-card",
                        !workflow.enabled && "opacity-70 grayscale-[0.3]"
                    )}>
                        <CardHeader className="flex flex-row items-start justify-between p-8 pb-4">
                            <div className="space-y-1.5 pr-2 flex-1">
                                <div className="flex items-center gap-4">
                                    <CardTitle className="text-2xl font-black tracking-tight">{workflow.name}</CardTitle>
                                    {!workflow.enabled && <Badge variant="secondary" className="rounded-[8px] font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 border-none">معطل</Badge>}
                                </div>
                                <CardDescription className="text-sm font-medium text-muted-foreground line-clamp-1">
                                    {TRIGGERS[workflow.trigger] || workflow.trigger}
                                    {workflow.triggerConfig?.keyword && ` • "${workflow.triggerConfig.keyword}"`}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={workflow.enabled}
                                    onCheckedChange={() => toggleWorkflow(workflow._id)}
                                    className="data-[state=checked]:bg-success scale-110"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-[12px] text-muted-foreground">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-[16px] border-border/50 p-2 min-w-[160px]">
                                        <DropdownMenuItem asChild>
                                            <Link href={`/workflows/${workflow._id}`} className="flex items-center gap-3 cursor-pointer py-2.5 rounded-[10px] font-bold">
                                                <Edit className="h-4 w-4" />
                                                <span>تعديل</span>
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => deleteWorkflow({ id: workflow._id })}
                                            className="flex items-center gap-3 text-destructive focus:text-destructive cursor-pointer py-2.5 rounded-[10px] font-bold"
                                        >
                                            <Trash className="h-4 w-4" />
                                            <span>حذف</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-8 p-8 pt-4">
                            {/* Visual Flow Preview */}
                            <div className="bg-muted/10 p-6 rounded-[24px] border border-border/30 relative overflow-hidden group-hover:bg-muted/20 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground">المسار التلقائي</span>
                                    <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{workflow.steps?.length || 0} خطوات</span>
                                </div>
                                <FlowPreview trigger={workflow.trigger} steps={workflow.steps || []} />
                            </div>

                            {/* Detailed Stats Row */}
                            <div className="flex items-center justify-between text-sm pt-2">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">التنفيذات</span>
                                        <div className="flex items-center gap-2">
                                            <Play className="h-4 w-4 text-primary" />
                                            <span className="font-black text-lg">{workflow.stats?.runs || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">آخر نشاط</span>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground opacity-50" />
                                            <span className="font-bold text-foreground">
                                                {workflow.stats?.lastRun ? new Date(workflow.stats.lastRun).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Link href={`/workflows/${workflow._id}`}>
                                    <Button variant="secondary" size="sm" className="h-10 rounded-[12px] font-bold bg-muted/50 hover:bg-muted text-foreground gap-2 pr-4 pl-4">
                                        تعديل المسار
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {workflows.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-center space-y-6 bg-card rounded-[48px] border border-dashed border-border/50">
                        <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center mb-2">
                            <Zap className="h-12 w-12 text-primary/40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-foreground">لا يوجد مسارات عمل حتى الآن</h3>
                            <p className="text-muted-foreground text-lg font-medium max-w-sm">ابدأ بإنشاء أول قاعدة أتمتة لتبدأ بتقديم خدمة عملاء أسرع بذكاء واتساب</p>
                        </div>
                        <Link href="/workflows/new">
                            <Button className="rounded-[16px] h-14 px-10 font-black text-lg">ابدأ الآن</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
