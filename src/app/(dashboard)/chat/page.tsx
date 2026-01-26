"use client"

import { MessageSquare, ShieldCheck, Zap, Bot } from "lucide-react"
import { motion } from "framer-motion"

export default function ChatIndexPage() {
  return (
    <div className="flex-1 flex items-center justify-center bg-background h-full p-8 relative" dir="rtl">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] mask-gradient pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg relative z-10"
      >
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full opacity-50" />
          <div className="h-28 w-28 rounded-[32px] bg-card border border-border/50 flex items-center justify-center relative shadow-sm">
            <MessageSquare className="h-12 w-12 text-primary" />
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-[12px] bg-primary flex items-center justify-center text-white">
              <Bot className="h-4 w-4" />
            </div>
          </div>
        </div>

        <h3 className="text-4xl font-black text-foreground mb-4 tracking-tight">مركز المحادثات الموحد</h3>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium mb-10 max-w-sm mx-auto">
          بوابتك للتواصل الذكي. أرسل، استقبل، وأتمت جميع محادثات عملائك من شاشة واحدة احترافية.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-[20px] bg-muted/30 border border-border/50 flex flex-col items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold text-foreground">تشفير كامل</span>
          </div>
          <div className="p-4 rounded-[20px] bg-muted/30 border border-border/50 flex flex-col items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-xs font-bold text-foreground">ردود فورية</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
