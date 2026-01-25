"use client"

import { memo } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import {
  MessageSquare,
  Zap,
  Users,
  BarChart3,
  Shield,
  Globe,
  Bot,
  Workflow,
} from "lucide-react"

interface Feature {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  stat?: string
}

interface FeatureWithStat extends Feature {
  stat?: string
}

const features: FeatureWithStat[] = [
  {
    icon: Bot,
    title: "ذكاء اصطناعي",
    description: "ردود تلقائية ذكية على جميع الرسائل",
    stat: "10M+ رمز",
  },
  {
    icon: MessageSquare,
    title: "إدارة المحادثات",
    description: "اربط وأدار جميع المحادثات من مكان واحد",
    stat: "300% زيادة",
  },
  {
    icon: Zap,
    title: "أتمتة كاملة",
    description: "وفر الوقت مع أتمتة كاملة للعمليات",
    stat: "50% توفير",
  },
  {
    icon: BarChart3,
    title: "تحليلات متقدمة",
    description: "تتبع أداءك في الوقت الفعلي",
    stat: "بيانات مباشرة",
  },
  {
    icon: Workflow,
    title: "حملات ذكية",
    description: "أنشئ حملات فعالة بسهولة",
    stat: "نتائج فورية",
  },
  {
    icon: Shield,
    title: "آمن ومحمي",
    description: "بياناتك محمية ومشفرة",
    stat: "100% آمن",
  },
]

export const FeatureShowcase = memo(function FeatureShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            كل ما تحتاجه في مكان واحد
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            منصة شاملة لإدارة واتساب للأعمال
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    {feature.stat && (
                      <div className="text-xs text-primary font-medium mt-0.5">
                        {feature.stat}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
})
