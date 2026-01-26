"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Download, CheckCircle2, Users, Tag, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { ar } from "date-fns/locale"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface ExportDialogProps {
    allContacts: any[]
    filteredContacts: any[]
    uniqueTags: string[]
}

export function ExportDialog({ allContacts, filteredContacts, uniqueTags }: ExportDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [exportType, setExportType] = useState<"all" | "filtered" | "tags">("filtered")
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const getFilteredData = () => {
        if (exportType === "all") return allContacts
        if (exportType === "filtered") return filteredContacts
        if (exportType === "tags") {
            if (selectedTags.length === 0) return []
            return allContacts.filter(c =>
                (c.tags || []).some((t: string) => selectedTags.includes(t))
            )
        }
        return []
    }

    const handleExport = () => {
        const data = getFilteredData()
        if (!data || data.length === 0) {
            toast.error("لا توجد بيانات لتصديرها بناءً على الفلتر المختار")
            return
        }

        try {
            const exportData = data.map(contact => ({
                "الاسم": contact.name || "بدون اسم",
                "رقم الهاتف": contact.phone || "",
                "البريد الإلكتروني": contact.email || "",
                "الوسوم": (contact.tags || []).join(", "),
                "تاريخ الإضافة": format(contact.createdAt, "yyyy/MM/dd HH:mm", { locale: ar })
            }))

            const worksheet = XLSX.utils.json_to_sheet(exportData)
            worksheet["!dir"] = "rtl"
            const workbook = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(workbook, worksheet, "العملاء")

            const dateStr = format(new Date(), "yyyy-MM-dd")
            const filename = `customers_export_${exportType}_${dateStr}.xlsx`

            XLSX.writeFile(workbook, filename)
            toast.success(`تم تصدير ${data.length} عميل بنجاح`)
            setIsOpen(false)
        } catch (error) {
            console.error("Export error:", error)
            toast.error("فشل في تصدير البيانات")
        }
    }

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        )
    }

    const previewCount = getFilteredData().length

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-border/50 hover:bg-muted font-black rounded-[14px] shadow-none h-12 px-6">
                    <Download className="h-4 w-4" />
                    تصدير إلى إكسل
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[24px] p-0 overflow-hidden border-2 border-border/50 shadow-none">
                <DialogHeader className="p-6 bg-muted/20 border-b border-border/50">
                    <DialogTitle className="text-xl font-black tracking-tight">تصدير جهات الاتصال</DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: "all", label: "تصدير الكل", count: allContacts.length, icon: Users },
                            { id: "filtered", label: "تصدير الفلتر الحالي", count: filteredContacts.length, icon: Filter },
                            { id: "tags", label: "تصدير حسب وسوم محددة", count: uniqueTags.length, icon: Tag },
                        ].map((opt) => (
                            <div
                                key={opt.id}
                                onClick={() => setExportType(opt.id as any)}
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-[16px] border-2 cursor-pointer transition-all",
                                    exportType === opt.id
                                        ? "border-primary bg-primary/5 shadow-sm"
                                        : "border-border/50 bg-background hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-[12px] flex items-center justify-center transition-colors",
                                        exportType === opt.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                    )}>
                                        <opt.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-black tracking-tight">{opt.label}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            {opt.id === "tags" ? `${opt.count} وسم متاح` : `${opt.count} جهة اتصال`}
                                        </p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                                    exportType === opt.id ? "border-primary bg-primary" : "border-border"
                                )}>
                                    {exportType === opt.id && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in-50" />}
                                </div>
                            </div>
                        ))}
                    </div>

                    {exportType === "tags" && uniqueTags.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 mr-1">اختر الوسوم للتصدير:</p>
                            <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1">
                                {uniqueTags.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                                        className={cn(
                                            "cursor-pointer px-3 py-1.5 rounded-full font-bold text-xs transition-all",
                                            selectedTags.includes(tag)
                                                ? "bg-primary text-white border-primary shadow-sm active:scale-95"
                                                : "bg-muted/10 text-muted-foreground border-border/50 hover:bg-muted/30"
                                        )}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                        {selectedTags.includes(tag) && <X className="h-3 w-3 mr-2" />}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-success/5 border-2 border-success/10 rounded-[18px] p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-success" />
                            <span className="text-sm font-black text-success">إجمالي السيتم تصديره:</span>
                        </div>
                        <span className="text-2xl font-black text-success tracking-tighter">{previewCount}</span>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/10 border-t border-border/50 flex flex-row items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                        className="rounded-[12px] h-10 px-6 font-bold text-muted-foreground"
                    >
                        إلغاء
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={previewCount === 0}
                        className="rounded-[14px] h-12 px-10 font-black bg-primary text-white shadow-none active:scale-95 transition-all"
                    >
                        تحميل الملف الآن
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
