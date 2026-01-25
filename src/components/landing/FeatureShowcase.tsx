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
  highlight?: boolean
}

const features: Feature[] = [
  {
    icon: MessageSquare,
    title: "واتساب للأعمال",
    description: "اربط وأدار جميع المحادثات من مكان واحد",
  },
  {
    icon: Bot,
    title: "ذكاء اصطناعي",
    description: "ردود تلقائية ذكية على جميع الرسائل",
  },
  {
    icon: Zap,
    title: "أتمتة",
    description: "وفر الوقت مع أتمتة كاملة للعمليات",
  },
  {
    icon: Users,
    title: "جهات الاتصال",
    description: "نظم عملائك بسهولة",
  },
  {
    icon: BarChart3,
    title: "تحليلات",
    description: "تتبع أداءك في الوقت الفعلي",
  },
  {
    icon: Workflow,
    title: "حملات",
    description: "أنشئ حملات فعالة بسهولة",
  },
  {
    icon: Shield,
    title: "آمن",
    description: "بياناتك محمية ومشفرة",
  },
  {
    icon: Globe,
    title: "متعدد اللغات",
    description: "دعم العربية والإنجليزية",
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
          className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="space-y-4">
                <Icon className="h-5 w-5 text-primary opacity-60" />
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
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
