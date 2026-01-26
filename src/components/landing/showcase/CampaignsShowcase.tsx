"use client"

import { motion } from "framer-motion"
import { Send, Eye, MousePointerClick, MoreHorizontal, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function CampaignsShowcase() {
    const campaigns = [
        { name: "عروض الصيف", status: "sent", sent: 12500, delivered: 98, read: 82 },
        { name: "سلة متروكة", status: "active", sent: 430, delivered: 99, read: 88 },
        { name: "ترحيب بالعملاء", status: "active", sent: 850, delivered: 97, read: 90 },
    ]

    return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-muted/20 rounded-[24px] border border-border/50 p-8 relative overflow-hidden">

            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] mask-gradient" />

            <div className="w-full max-w-lg space-y-4 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-foreground">الحملات النشطة</h3>
                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">
                        تحديث مباشر
                    </div>
                </div>

                {campaigns.map((campaign, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="bg-card p-5 rounded-[20px] border border-border/50 shadow-sm hover:border-primary/20 hover:shadow-md transition-all group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="font-bold text-foreground text-lg mb-1">{campaign.name}</div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                    <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        campaign.status === 'active' ? "bg-green-500 animate-pulse" : "bg-blue-500"
                                    )} />
                                    {campaign.status === 'active' ? "نشط الآن" : "تم الإرسال"}
                                </div>
                            </div>
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                    <Send className="h-3 w-3" /> تم الإرسال
                                </div>
                                <div className="text-sm font-black text-foreground">{campaign.sent.toLocaleString()}</div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: "100%" }}
                                        transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                                        className="h-full bg-blue-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                    <CheckCircle2 className="h-3 w-3" /> تم الاستلام
                                </div>
                                <div className="text-sm font-black text-foreground">98%</div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${campaign.delivered}%` }}
                                        transition={{ duration: 1, delay: 0.7 + (i * 0.1) }}
                                        className="h-full bg-green-500 rounded-full"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                    <Eye className="h-3 w-3" /> قراءة
                                </div>
                                <div className="text-sm font-black text-foreground">{campaign.read}%</div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${campaign.read}%` }}
                                        transition={{ duration: 1, delay: 0.9 + (i * 0.1) }}
                                        className="h-full bg-primary/80 rounded-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
