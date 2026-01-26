"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import { api } from "@convex/_generated/api"
import { useUserMutation } from "@/hooks/useUserMutation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function ExcelImportDialog() {
    const bulkCreate = useUserMutation(api.contacts.bulkCreate)
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<"upload" | "map" | "importing">("upload")
    const [rawData, setRawData] = useState<any[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [mapping, setMapping] = useState({
        name: "",
        phone: "",
        email: ""
    })
    const [commonTag, setCommonTag] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: "array" })
                const firstSheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[firstSheetName]
                const json = XLSX.utils.sheet_to_json(worksheet)

                if (json.length === 0) {
                    toast.error("الملف فارغ")
                    return
                }

                setRawData(json)
                const cols = Object.keys(json[0] as object)
                setColumns(cols)

                // Attempt auto-mapping
                const autoMap = { ...mapping }
                cols.forEach(col => {
                    const low = col.toLowerCase()
                    if (low.includes("name") || low.includes("الاسم")) autoMap.name = col
                    if (low.includes("phone") || low.includes("الهاتف") || low.includes("جوال") || low.includes("mobile")) autoMap.phone = col
                    if (low.includes("email") || low.includes("بريد")) autoMap.email = col
                })
                setMapping(autoMap)
                setStep("map")
            } catch (error) {
                console.error("Excel parse error:", error)
                toast.error("فشل في قراءة ملف الإكسل")
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const handleImport = async () => {
        if (!mapping.phone || !mapping.name) {
            toast.error("يجب تحديد أعمدة الاسم ورقم الهاتف")
            return
        }

        setIsSubmitting(true)
        setStep("importing")
        try {
            const contacts = rawData.map(row => {
                const phone = String(row[mapping.phone] || "").replace(/[^0-9+]/g, "")
                return {
                    name: String(row[mapping.name] || "بدون اسم"),
                    phone,
                    email: mapping.email ? String(row[mapping.email] || "") : undefined,
                    tags: commonTag ? [commonTag] : []
                }
            }).filter(c => c.phone.length > 5)

            if (contacts.length === 0) {
                toast.error("لم يتم العثور على أرقام هواتف صالحة")
                setStep("map")
                return
            }

            await bulkCreate({ contacts })
            toast.success(`تم استيراد ${contacts.length} عملاء بنجاح`)
            handleReset()
            setIsOpen(false)
        } catch (error) {
            console.error("Bulk create error:", error)
            toast.error("فشل في استيراد العملاء")
            setStep("map")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReset = () => {
        setStep("upload")
        setRawData([])
        setColumns([])
        setMapping({ name: "", phone: "", email: "" })
        setCommonTag("")
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) handleReset()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5 text-primary rounded-[14px]">
                    <FileSpreadsheet className="h-4 w-4" />
                    استيراد من إكسل
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px] rounded-[24px] p-0 overflow-hidden border-2 border-border/50 shadow-none">
                <DialogHeader className="p-6 bg-muted/20 border-b border-border/50">
                    <DialogTitle className="text-xl font-black tracking-tight">استيراد جهات الاتصال</DialogTitle>
                </DialogHeader>

                <div className="p-8">
                    {step === "upload" && (
                        <div
                            className="border-2 border-dashed border-border/50 rounded-[20px] p-12 flex flex-col items-center justify-center gap-4 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 rounded-[22px] bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/5">
                                <Upload className="h-8 w-8" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-black tracking-tight">اضغط لرفع ملف الإكسل</p>
                                <p className="text-sm text-muted-foreground font-medium">يدعم صيغ .xlsx و .csv</p>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accent-color="primary"
                                onChange={handleFileUpload}
                                accept=".xlsx, .xls, .csv"
                            />
                        </div>
                    )}

                    {step === "map" && (
                        <div className="space-y-6">
                            <div className="bg-success/5 border-2 border-success/10 rounded-[18px] p-4 flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-success" />
                                <span className="text-sm font-black text-success">تم تحميل {rawData.length} صف من البيانات</span>
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">عمود الاسم *</Label>
                                    <Select value={mapping.name} onValueChange={(v) => setMapping(m => ({ ...m, name: v }))}>
                                        <SelectTrigger className="rounded-[12px] h-11 border-2 border-border/50 font-bold bg-background">
                                            <SelectValue placeholder="اختر العمود" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[14px]">
                                            {columns.map(col => <SelectItem key={col} value={col} className="font-bold">{col}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">عمود الهاتف *</Label>
                                    <Select value={mapping.phone} onValueChange={(v) => setMapping(m => ({ ...m, phone: v }))}>
                                        <SelectTrigger className="rounded-[12px] h-11 border-2 border-border/50 font-bold bg-background">
                                            <SelectValue placeholder="اختر العمود" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[14px]">
                                            {columns.map(col => <SelectItem key={col} value={col} className="font-bold">{col}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">عمود البريد الالكتروني (اختياري)</Label>
                                    <Select value={mapping.email} onValueChange={(v) => setMapping(m => ({ ...m, email: v }))}>
                                        <SelectTrigger className="rounded-[12px] h-11 border-2 border-border/50 font-bold bg-background">
                                            <SelectValue placeholder="اختر العمود" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-[14px]">
                                            <SelectItem value="_none" className="font-bold text-muted-foreground italic">تخطي هذا الحقل</SelectItem>
                                            {columns.map(col => <SelectItem key={col} value={col} className="font-bold">{col}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-4 border-t border-border/30 mt-2">
                                    <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest mr-1">إضافة وسم لهذه المجموعة (اختياري)</Label>
                                    <Input
                                        value={commonTag}
                                        onChange={(e) => setCommonTag(e.target.value)}
                                        placeholder="مثال: حملة_رمضان, عملاء_جدد"
                                        className="h-11 rounded-[12px] border-2 border-border/50 font-bold mt-2 bg-background focus:ring-0 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "importing" && (
                        <div className="py-12 flex flex-col items-center justify-center gap-6">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 rounded-full border-4 border-muted/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-xl font-black tracking-tight">جاري استيراد البيانات...</p>
                                <p className="text-sm text-muted-foreground font-medium">يرجى الانتظار بينما نقوم بمزامنة جهات الاتصال</p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-muted/10 border-t border-border/50 flex flex-row items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        disabled={isSubmitting}
                        className="rounded-[12px] h-10 px-6 font-bold text-muted-foreground"
                    >
                        إلغاء
                    </Button>
                    {step === "map" && (
                        <Button
                            onClick={handleImport}
                            disabled={isSubmitting || !mapping.phone || !mapping.name}
                            className="rounded-[14px] h-12 px-10 font-black bg-primary text-white shadow-none active:scale-95 transition-all"
                        >
                            بدء الاستيراد الآن
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
