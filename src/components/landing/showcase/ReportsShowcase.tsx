"use client"

import { motion } from "framer-motion"
import { BarChart3, TrendingUp, PieChart, ArrowUpRight, Activity } from "lucide-react"

export function ReportsShowcase() {
    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-[24px] border border-border/50 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-gradient opacity-20" />

            <div className="w-full max-w-2xl grid md:grid-cols-2 gap-6 relative z-10">
                {/* Main Insight Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className="bg-card p-6 rounded-[24px] border border-border/50 shadow-xl col-span-2 md:col-span-1 flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div className="p-3 rounded-[16px] bg-primary/10 text-primary">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div className="flex items-center gap-1 text-success font-black text-sm">
                                <ArrowUpRight className="h-4 w-4" />
                                +24%
                            </div>
                        </div>
                        <h4 className="text-xl font-black mb-1">نمو المبيعات</h4>
                        <p className="text-sm text-muted-foreground font-medium">معدل التحويل عبر واتساب</p>
                    </div>

                    <div className="mt-8 flex items-end gap-2 h-24">
                        {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                whileInView={{ height: `${h}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="flex-1 bg-primary/20 rounded-t-[4px] relative group"
                            >
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-primary group-hover:bg-primary/80 transition-colors rounded-t-[4px]" />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Secondary Stats */}
                <div className="space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="bg-card p-5 rounded-[24px] border border-border/50 shadow-lg flex items-center gap-4"
                    >
                        <div className="p-3 rounded-[14px] bg-orange-500/10 text-orange-500">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-lg font-black leading-none">89%</div>
                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">سرعة الرد بالذكاء الصناعي</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card p-5 rounded-[24px] border border-border/50 shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="font-bold text-sm">توزيع القنوات</h5>
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: "سلة", val: 65, color: "bg-primary" },
                                { label: "حملات", val: 25, color: "bg-blue-500" },
                                { label: "أخرى", val: 10, color: "bg-slate-300" }
                            ].map((p, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black uppercase">
                                        <span>{p.label}</span>
                                        <span>{p.val}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${p.val}%` }}
                                            className={cn("h-full rounded-full", p.color)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ")
}
