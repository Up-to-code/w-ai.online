"use client"

import { motion } from "framer-motion"
import { MessageSquare, Zap, Clock, UserPlus, ArrowDown, Send, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AutomationShowcase() {
    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-[24px] border border-border/50 p-8 overflow-hidden relative">

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-gradient" />

            <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">

                {/* Trigger Node */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full bg-card p-4 rounded-[16px] border-2 border-primary/20 shadow-lg flex items-center gap-4 relative z-20"
                >
                    <div className="h-10 w-10 rounded-[12px] bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">المحفز</div>
                        <div className="font-bold text-foreground">رسالة جديدة تحتوي "عرض"</div>
                    </div>
                    {/* Connecting Line */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-6 w-0.5 bg-primary/20" />
                </motion.div>

                {/* Arrow Down */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="rounded-full bg-background border border-border p-1 z-10 text-muted-foreground"
                >
                    <ArrowDown className="h-4 w-4" />
                </motion.div>

                {/* Action 1: Send Template */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-full bg-card p-4 rounded-[16px] border border-border shadow-sm flex items-center gap-4 relative"
                >
                    <div className="h-10 w-10 rounded-[12px] bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <Send className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">إجراء</div>
                        <div className="font-bold text-foreground">إرسال تفاصيل العرض</div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-6 w-0.5 bg-border" />
                </motion.div>

                {/* Arrow Down */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    className="rounded-full bg-background border border-border p-1 z-10 text-muted-foreground"
                >
                    <ArrowDown className="h-4 w-4" />
                </motion.div>

                {/* Action 2: Wait */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="w-full bg-card p-4 rounded-[16px] border border-border shadow-sm flex items-center gap-4 relative"
                >
                    <div className="h-10 w-10 rounded-[12px] bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">تأخير</div>
                        <div className="font-bold text-foreground">انتظار 15 دقيقة</div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 h-6 w-0.5 bg-border" />
                </motion.div>

                {/* Arrow Down */}
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    className="rounded-full bg-background border border-border p-1 z-10 text-muted-foreground"
                >
                    <ArrowDown className="h-4 w-4" />
                </motion.div>

                {/* Action 3: Assign User */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="w-full bg-card p-4 rounded-[16px] border border-border shadow-sm flex items-center gap-4 relative"
                >
                    <div className="h-10 w-10 rounded-[12px] bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <UserPlus className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">تعيين</div>
                        <div className="font-bold text-foreground">تعيين لفريق المبيعات</div>
                    </div>

                    <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        transition={{ delay: 1, type: "spring" }}
                        className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 shadow-lg"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                </motion.div>

            </div>
        </div>
    )
}
