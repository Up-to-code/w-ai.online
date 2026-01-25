"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Clock, MessageSquare, TrendingDown, Users } from "lucide-react"

const problems = [
  {
    icon: Clock,
    title: "إدارة المحادثات تستغرق وقتاً طويلاً",
    description: "الرد على كل رسالة يدوياً يستهلك ساعات من يومك",
  },
  {
    icon: MessageSquare,
    title: "صعوبة متابعة المحادثات المتعددة",
    description: "فقدان الرسائل المهمة بين مئات المحادثات",
  },
  {
    icon: TrendingDown,
    title: "انخفاض معدل الاستجابة",
    description: "تأخير الردود يفقدك العملاء والفرص",
  },
  {
    icon: Users,
    title: "عدم القدرة على التوسع",
    description: "النمو محدود بقدرتك على الرد يدوياً",
  },
]

export const ProblemStatement = memo(function ProblemStatement() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            هل تواجه هذه التحديات؟
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            إدارة واتساب للأعمال يدوياً تستهلك وقتك وتمنع نموك
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {problems.map((problem, index) => {
            const Icon = problem.icon
            return (
              <div
                key={index}
                className="p-6 rounded-lg bg-muted/30 border border-border"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{problem.title}</h3>
                    <p className="text-sm text-muted-foreground">{problem.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
})
