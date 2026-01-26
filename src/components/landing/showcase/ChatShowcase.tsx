"use client"

import { motion } from "framer-motion"
import { Send, MoreVertical, Phone, Video, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

export function ChatShowcase() {
    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-[24px] border border-border/50 p-6 relative overflow-hidden">

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-gradient" />

            {/* Chat Interface Container */}
            <div className="w-full max-w-md bg-card rounded-[24px] border border-border/60 overflow-hidden flex flex-col h-[400px] relative z-10">

                {/* Chat Header */}
                <div className="p-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center">
                                <span className="font-bold text-primary">SA</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
                        </div>
                        <div>
                            <h4 className="font-bold text-foreground">سارة أحمد</h4>
                            <p className="text-xs text-muted-foreground font-medium">نشط الآن</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <Phone className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <Video className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-slate-50/50 dark:bg-black/20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="flex justify-end"
                    >
                        <div className="bg-primary text-white p-3 rounded-[16px] rounded-tl-sm max-w-[80%]">
                            <p className="text-sm">مرحباً! هل العرض الخاص بالصيف لا يزال سارياً؟</p>
                            <span className="text-[10px] opacity-70 mt-1 block text-left">10:30 ص</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                        className="flex justify-start items-end gap-2"
                    >
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                            <Bot className="h-3 w-3" />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-[16px] rounded-tr-sm max-w-[80%] shadow-sm border border-border/50">
                            <p className="text-sm font-medium text-foreground">أهلاً بك سارة! 👋</p>
                            <p className="text-sm text-foreground mt-1">نعم، العرض ساري حتى نهاية الأسبوع!</p>
                            <div className="mt-2 flex gap-2">
                                <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold">خصم 50%</span>
                                <span className="bg-primary/10 text-primary text-[10px] px-2 py-1 rounded-full font-bold">شحن مجاني</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground mt-1 block text-right">10:30 ص</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                        className="flex justify-end"
                    >
                        <div className="bg-primary text-white p-3 rounded-[16px] rounded-tl-sm max-w-[80%]">
                            <p className="text-sm">رائع! أريد طلب المنتج الآن.</p>
                            <span className="text-[10px] opacity-70 mt-1 block text-left">10:31 ص</span>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 1.2 }}
                        className="flex justify-center my-4"
                    >
                        <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-200 dark:border-green-900/50">
                            تم إنشاء طلب #4829 تلقائياً ✅
                        </div>
                    </motion.div>
                </div>

                {/* Input Area */}
                <div className="p-3 bg-card border-t border-border/50">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-[14px] p-2 pr-4 border border-border/50">
                        <input
                            type="text"
                            placeholder="اكتب رسالة..."
                            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70"
                            disabled
                        />
                        <button className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform">
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}
