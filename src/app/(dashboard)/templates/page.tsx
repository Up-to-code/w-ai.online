"use client"

import { useState } from "react"
import Link from "next/link"
import { useUserQuery } from "@/hooks/useUserQuery"
import { useUserContext } from "@/hooks/useUserContext"
import { useAction } from "convex/react"
import { api } from "@convex/_generated/api"
import { Doc } from "@convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/ui/stat-card"
import {
    Plus,
    Search,
    FileText,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Edit,
    Eye,
    Image as ImageIcon,
    Video,
    RefreshCw,
    Trash2,
    Link2,
    Phone,
    MoreVertical
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

export default function TemplatesPage() {
    const { userId } = useUserContext();
    const templates = useUserQuery(api.templates.list, {}) || []
    const syncFromMeta = useAction(api.templates.syncFromMeta)
    const deleteTemplate = useAction(api.templates.deleteTemplate)

    const [search, setSearch] = useState("")
    const [activeTab, setActiveTab] = useState("all")
    const [previewTemplate, setPreviewTemplate] = useState<any>(null)
    const [deleteTemplateData, setDeleteTemplateData] = useState<any>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message })
        setTimeout(() => setToast(null), 3000)
    }

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            if (!userId) throw new Error("User not authenticated");
            const count = await syncFromMeta({ userId })
            showToast("success", `تم مزامنة ${count} قالب بنجاح`)
        } catch (error) {
            logger.error("Sync failed:", error)
            showToast("error", "فشل في المزامنة")
        } finally {
            setIsSyncing(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTemplateData) return
        setIsDeleting(true)
        try {
            if (!userId) throw new Error("User not authenticated");
            await deleteTemplate({ userId, name: deleteTemplateData.name })
            showToast("success", `تم حذف القالب "${deleteTemplateData.name}" بنجاح`)
            setDeleteTemplateData(null)
        } catch (error: any) {
            logger.error("Delete failed:", error)
            const errorMessage = error.message || String(error)
            if (errorMessage.includes("Permission") || errorMessage.includes("(#100)")) {
                showToast("error", "فشل الحذف: لا تملك صلاحيات كافية في حساب Meta")
            } else {
                showToast("error", "فشل في حذف القالب")
            }
        } finally {
            setIsDeleting(false)
        }
    }

    const filteredTemplates = (templates || []).filter((t: Doc<"templates">) => {
        const matchesSearch = t.name.includes(search) || (t.components && JSON.stringify(t.components).includes(search))
        const matchesTab = activeTab === "all" || t.status.toLowerCase() === activeTab.toLowerCase()
        return matchesSearch && matchesTab
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "APPROVED":
                return <Badge className="bg-success/10 text-success hover:bg-success/20 gap-1 shadow-none"><CheckCircle2 className="w-3 h-3" /> معتمد</Badge>
            case "PENDING":
                return <Badge variant="secondary" className="gap-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3" /> قيد المراجعة</Badge>
            case "REJECTED":
                return <Badge variant="destructive" className="gap-1"><AlertTriangle className="w-3 h-3" /> مرفوض</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getMediaIcon = (components: any[]) => {
        const header = components?.find((c: any) => c.type === "HEADER")
        if (!header) return <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><FileText className="h-5 w-5" /></div>

        switch (header.format) {
            case "IMAGE": return <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><ImageIcon className="h-5 w-5" /></div>
            case "VIDEO": return <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600"><Video className="h-5 w-5" /></div>
            default: return <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary"><FileText className="h-5 w-5" /></div>
        }
    }

    const getBodyText = (components: any[]) => {
        const body = components?.find((c: any) => c.type === "BODY")
        return body?.text || ""
    }

    const stats = {
        total: templates.length,
        approved: templates.filter((t: Doc<"templates">) => t.status === "APPROVED").length,
        pending: templates.filter((t: Doc<"templates">) => t.status === "PENDING").length,
        rejected: templates.filter((t: Doc<"templates">) => t.status === "REJECTED").length,
    }

    return (
        <div className="space-y-10 p-6 sm:p-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <h1 className="text-3xl font-black tracking-tight text-foreground">قوالب الرسائل</h1>
                    </div>
                    <p className="text-base text-muted-foreground font-medium">إدارة وتخصيص قوالب WhatsApp المعتمدة</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 h-12 px-6 font-black rounded-[14px] border-border/50 hover:bg-muted shadow-none"
                        onClick={handleSync}
                        disabled={isSyncing}
                    >
                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        مزامنة
                    </Button>
                    <Link href="/templates/new">
                        <Button className="gap-2 bg-primary hover:bg-primary/95 text-white rounded-[14px] h-12 px-8 font-black shadow-none border-none">
                            <Plus className="h-5 w-5" />
                            قالب جديد
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "إجمالي القوالب", value: stats.total, icon: FileText, color: "text-primary/70 bg-primary/5" },
                    { title: "معتمدة", value: stats.approved, icon: CheckCircle2, color: "text-success/70 bg-success/5" },
                    { title: "قيد المراجعة", value: stats.pending, icon: Clock, color: "text-yellow-500/70 bg-yellow-500/5" },
                    { title: "مرفوضة", value: stats.rejected, icon: AlertTriangle, color: "text-destructive/70 bg-destructive/5" }
                ].map((stat, i) => (
                    <Card key={i} className="border border-border/50 bg-card rounded-[20px] shadow-none overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-4">
                                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center", stat.color)}>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-3xl font-black tracking-tighter leading-none">{stat.value || 0}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        {stat.title}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="relative flex-1 min-w-[200px] max-w-md w-full group">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="بحث في القوالب..."
                        className="pl-4 pr-12 bg-muted/20 border-border/50 rounded-[14px] h-12 font-bold text-base focus:ring-primary/20 transition-all shadow-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="bg-muted/30 p-1 rounded-[14px] flex items-center border border-border/50 w-full sm:w-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="bg-transparent p-0 gap-1 w-full sm:w-auto">
                            <TabsTrigger value="all" className="rounded-[10px] px-6 h-9 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white">الكل</TabsTrigger>
                            <TabsTrigger value="approved" className="rounded-[10px] px-6 h-9 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white">معتمد</TabsTrigger>
                            <TabsTrigger value="pending" className="rounded-[10px] px-6 h-9 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white">مراجعة</TabsTrigger>
                            <TabsTrigger value="rejected" className="rounded-[10px] px-6 h-9 font-black transition-all data-[state=active]:bg-primary data-[state=active]:text-white">مرفوض</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Templates Grid */}
            {templates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-[24px] border-2 border-dashed border-border/50 hover:bg-muted/5 transition-colors">
                    <div className="w-24 h-24 bg-primary/5 rounded-[28px] flex items-center justify-center mb-6 border-2 border-primary/10">
                        <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-black mb-3 text-foreground tracking-tight">لا توجد قوالب حتى الآن</h3>
                    <p className="text-muted-foreground text-base max-w-sm mb-10 font-medium leading-relaxed">
                        ابدأ بإنشاء قالبك الأول للتواصل مع عملائك من خلال WhatsApp.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            className="h-12 px-8 rounded-[14px] font-black border-border/50 hover:bg-muted shadow-none"
                            onClick={handleSync}
                        >
                            مزامنة من Meta
                        </Button>
                        <Link href="/templates/new">
                            <Button className="h-12 px-8 rounded-[14px] font-black bg-primary text-white shadow-none">
                                إنشاء قالب جديد
                            </Button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTemplates.map((template: Doc<"templates">) => (
                        <Card key={template._id} className="group overflow-hidden border border-border/50 bg-card rounded-[20px] shadow-none hover:bg-muted/5 transition-all duration-300">
                            <CardHeader className="pb-4 pt-6 px-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        {getMediaIcon(template.components)}
                                        <div className="min-w-0">
                                            <CardTitle className="text-lg font-black tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{template.name}</CardTitle>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-[6px] font-black uppercase tracking-widest bg-primary/5 text-primary border-none">
                                                    {template.category}
                                                </Badge>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{template.language}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-muted">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-[14px] border-border/50 p-2 min-w-[160px]">
                                            <Link href={`/templates/new?edit=${template.name}`}>
                                                <DropdownMenuItem className="rounded-[10px] gap-2 font-bold cursor-pointer">
                                                    <Edit className="h-4 w-4 text-primary" />
                                                    تعديل
                                                </DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuItem
                                                className="rounded-[10px] gap-2 font-bold cursor-pointer text-destructive focus:text-destructive"
                                                onClick={() => setDeleteTemplateData(template)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                حذف
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="px-6 pb-6 pt-0">
                                <div className="bg-muted/10 rounded-[14px] p-4 mb-5 min-h-[100px] border border-border/30">
                                    <p className="text-sm font-bold text-muted-foreground/80 line-clamp-3 leading-relaxed">
                                        {getBodyText(template.components) || template.content || "لا يوجد محتوى نصي"}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    {getStatusBadge(template.status)}
                                    <Button variant="ghost" size="sm" className="h-9 px-4 rounded-[10px] font-black text-primary hover:text-primary hover:bg-primary/10 transition-colors" onClick={() => setPreviewTemplate(template)}>
                                        <Eye className="h-4 w-4 ml-2" />
                                        معاينة
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
                <DialogContent className="max-w-sm p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <DialogHeader className="sr-only">
                        <DialogTitle>معاينة القالب</DialogTitle>
                    </DialogHeader>
                    {previewTemplate && (
                        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[320px] shadow-xl flex flex-col">
                            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
                            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

                            {/* WhatsApp Header */}
                            <div className="bg-[#008069] dark:bg-[#202c33] p-3 pt-8 flex items-center gap-2 text-white z-10 rounded-t-[2rem]">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold truncate">{previewTemplate.name}</div>
                                    <div className="text-[10px] opacity-80">Business Account</div>
                                </div>
                            </div>

                            {/* Message Area */}
                            <div className="flex-1 p-3 overflow-y-auto bg-[#E5DDD5] dark:bg-[#111b21] bg-opacity-90 relative rounded-b-[2rem]">
                                {previewTemplate.components?.some((c: any) => c.type === "CAROUSEL") ? (
                                    // Carousel View
                                    <div className="space-y-2">
                                        <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%]">
                                            <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                                                {previewTemplate.components?.find((c: any) => c.type === "BODY")?.text || "Carousel Message"}
                                            </p>
                                        </div>
                                        <div className="flex overflow-x-auto gap-2 pb-2 -mx-3 px-3 scrollbar-hide">
                                            {previewTemplate.components.find((c: any) => c.type === "CAROUSEL")?.cards?.map((card: any, i: number) => (
                                                <div key={i} className="bg-white dark:bg-[#202c33] rounded-lg shadow-sm min-w-[200px] max-w-[200px] overflow-hidden shrink-0">
                                                    {card.components.find((c: any) => c.type === "HEADER") && (
                                                        <div className="h-24 bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                                            {card.components.find((c: any) => c.type === "HEADER")?.format === "VIDEO" ? (
                                                                <Video className="h-6 w-6 text-gray-400" />
                                                            ) : (
                                                                <ImageIcon className="h-6 w-6 text-gray-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                    <div className="p-2">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {card.components.find((c: any) => c.type === "BODY")?.text || "..."}
                                                        </p>
                                                        <div className="mt-2 space-y-1">
                                                            {card.components.find((c: any) => c.type === "BUTTONS")?.buttons?.map((btn: any, bI: number) => (
                                                                <div key={bI} className="bg-gray-50 dark:bg-[#2a3942] p-1 text-center text-xs text-[#00a884] rounded border border-gray-100 dark:border-gray-700">
                                                                    {btn.text}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    // Standard View
                                    <>
                                        <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%] mb-2">
                                            {/* Header Media */}
                                            {previewTemplate.components?.find((c: any) => c.type === "HEADER") && (
                                                <div className="mb-2">
                                                    {previewTemplate.components.find((c: any) => c.type === "HEADER")?.format === "TEXT" ? (
                                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                            {previewTemplate.components.find((c: any) => c.type === "HEADER")?.text}
                                                        </p>
                                                    ) : (
                                                        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 flex items-center justify-center">
                                                            {previewTemplate.components.find((c: any) => c.type === "HEADER")?.format === "IMAGE" ? (
                                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                                            ) : (
                                                                <Video className="h-8 w-8 text-gray-400" />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Body */}
                                            <p className="text-sm leading-relaxed text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                                                {previewTemplate.components?.find((c: any) => c.type === "BODY")?.text || previewTemplate.content || "لا يوجد محتوى"}
                                            </p>

                                            {/* Footer */}
                                            {previewTemplate.components?.find((c: any) => c.type === "FOOTER") && (
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                                                    {previewTemplate.components.find((c: any) => c.type === "FOOTER")?.text}
                                                </p>
                                            )}

                                            <div className="text-[10px] text-gray-400 text-right mt-1">
                                                12:00 PM
                                            </div>
                                        </div>

                                        {/* Buttons */}
                                        {previewTemplate.components?.find((c: any) => c.type === "BUTTONS") && (
                                            <div className="space-y-1 max-w-[90%]">
                                                {previewTemplate.components.find((c: any) => c.type === "BUTTONS")?.buttons?.map((btn: any, i: number) => (
                                                    <div key={i} className="bg-white dark:bg-[#202c33] rounded-lg p-2.5 text-center text-sm text-[#00a884] font-medium shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2a3942] transition-colors flex items-center justify-center gap-2">
                                                        {btn.type === "URL" && <Link2 className="h-3.5 w-3.5" />}
                                                        {btn.type === "PHONE_NUMBER" && <Phone className="h-3.5 w-3.5" />}
                                                        {btn.text}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteTemplateData} onOpenChange={(open) => !open && setDeleteTemplateData(null)}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>حذف القالب</DialogTitle>
                    </DialogHeader>
                    {deleteTemplateData && (
                        <div className="space-y-4">
                            <div className="bg-destructive/10 p-4 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <p className="text-sm text-destructive-foreground">
                                    هل أنت متأكد من حذف القالب <strong>&quot;{deleteTemplateData.name}&quot;</strong>؟
                                    سيتم حذفه من حساب Meta أيضاً ولا يمكن التراجع عن هذا الإجراء.
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button variant="outline" onClick={() => setDeleteTemplateData(null)} className="rounded-xl">إلغاء</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="rounded-xl">
                                    {isDeleting ? "جاري الحذف..." : "تأكيد الحذف"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === "success" ? "bg-black text-white" : "bg-destructive text-white"
                    }`}>
                    {toast.message}
                </div>
            )}
        </div>
    )
}