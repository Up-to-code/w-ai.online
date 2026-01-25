"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Zap, Bot, BarChart3, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"

const steps = [
  {
    icon: Zap,
    title: "ربط سريع",
    description: "اربط حساب واتساب للأعمال في دقائق",
  },
  {
    icon: Bot,
    title: "ذكاء اصطناعي تلقائي",
    description: "ردود ذكية تلقائية على جميع الرسائل",
  },
  {
    icon: BarChart3,
    title: "إدارة شاملة",
    description: "حملات، محادثات، وتحليلات في مكان واحد",
  },
  {
    icon: CheckCircle2,
    title: "نمو سريع",
    description: "وسّع عملك بدون قيود",
  },
]

export const SolutionSection = memo(function SolutionSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()

  return (
    <section ref={ref} className="py-24 bg-muted/20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            الحل بسيط وفعال
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            منصة واحدة تحل جميع مشاكل إدارة واتساب للأعمال
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 max-w-6xl mx-auto"
        >
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={() => router.push("/dashboard")}
            className="text-lg px-10 py-7 bg-primary hover:opacity-90 transition-opacity"
          >
            جرب الحل الآن
            <ArrowRight className="mr-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
})
