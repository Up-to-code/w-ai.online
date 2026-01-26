"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Users, Send, Eye, TrendingUp, Zap, ArrowLeft, Check, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock FlowPreview for Landing Page
function MiniFlowPreview() {
    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2" dir="rtl">
            <div className="p-2 rounded-[16px] shrink-0 border border-primary/20 bg-primary/5 text-primary">
                <MessageSquare className="h-4 w-4" />
            </div>
            <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0" />
            <div className="flex items-center gap-2">
                <div className="p-2 rounded-[16px] shrink-0 border border-slate-200 bg-slate-50 text-slate-500">
                    <Zap className="h-4 w-4" />
                </div>
                <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0" />
                <div className="p-2 rounded-[16px] shrink-0 border border-primary/20 bg-primary/10 text-primary">
                    <Send className="h-4 w-4" />
                </div>
                <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0" />
                <div className="p-2 rounded-[16px] shrink-0 border border-primary/20 bg-primary/5 text-primary">
                    <Users className="h-4 w-4" />
                </div>
            </div>
        </div>
    )
}

export function DashboardPreview() {
    return (
        <div className="relative w-full max-w-5xl mx-auto p-4 md:p-8 bg-muted/20 rounded-[32px] border border-border/50">
            {/* Abstract Dashboard UI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Stats Column */}
                <div className="space-y-4">
                    <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-[16px] bg-primary/10 text-primary">
                                <Users className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-black text-foreground">1,240</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-muted-foreground">عملاء جدد</h3>
                            <div className="flex items-center text-primary text-sm font-bold">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +12% هذا الأسبوع
                            </div>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-[16px] bg-secondary text-secondary-foreground">
                                <Send className="h-6 w-6" />
                            </div>
                            <span className="text-2xl font-black text-foreground">85%</span>
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-muted-foreground">معدل الرد</h3>
                            <div className="flex items-center text-primary text-sm font-bold">
                                <Check className="h-3 w-3 mr-1" />
                                أداء ممتاز
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Active Workflow Card */}
                    <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-[12px] bg-primary flex items-center justify-center text-white">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">سلة متروكة</h3>
                                    <p className="text-xs text-muted-foreground font-medium">يعمل تلقائياً</p>
                                </div>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                نشط الآن
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-[20px] border border-border/50">
                            <MiniFlowPreview />
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-xl font-black text-foreground">450</div>
                                <div className="text-xs text-muted-foreground font-bold">رسالة</div>
                            </div>
                            <div>
                                <div className="text-xl font-black text-primary">120</div>
                                <div className="text-xs text-muted-foreground font-bold">مبيعات</div>
                            </div>
                            <div>
                                <div className="text-xl font-black text-primary">28%</div>
                                <div className="text-xs text-muted-foreground font-bold">تحويل</div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className="bg-card p-6 rounded-[24px] border border-border shadow-sm">
                        <h4 className="font-bold text-lg mb-4">النشاط الأخير</h4>
                        <div className="space-y-4">
                            {[1, 2].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-[12px] bg-muted flex items-center justify-center shrink-0">
                                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="h-2 bg-foreground/10 rounded w-3/4 mb-2"></div>
                                        <div className="h-2 bg-foreground/5 rounded w-1/2"></div>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-bold">منذ دقيقة</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
