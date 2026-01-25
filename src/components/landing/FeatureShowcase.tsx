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
    title: "ذكاء اصطناعي متقدم",
    description: "ردود ذكية تزيد المبيعات بنسبة 300% وتوفر 20 ساعة أسبوعياً",
    stat: "10M+ رمز",
  },
  {
    icon: MessageSquare,
    title: "إدارة محادثات موحدة",
    description: "اربط جميع حساباتك وزد الاستجابة 3x مع إدارة مركزية",
    stat: "300% زيادة",
  },
  {
    icon: Zap,
    title: "أتمتة كاملة",
    description: "وفر 50% من وقتك وزد الإنتاجية مع أتمتة ذكية 24/7",
    stat: "50% توفير",
  },
  {
    icon: BarChart3,
    title: "تحليلات في الوقت الفعلي",
    description: "راقب أداءك واتخذ قرارات ذكية تزيد أرباحك",
    stat: "بيانات مباشرة",
  },
  {
    icon: Workflow,
    title: "حملات تسويقية ذكية",
    description: "أنشئ حملات فعالة تزيد المبيعات بنسبة 40%",
    stat: "نتائج فورية",
  },
  {
    icon: Shield,
    title: "أمان كامل",
    description: "بياناتك محمية 100% مع تشفير متقدم",
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
            مميزات تزيد أرباحك
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            كل ما تحتاجه لزيادة مبيعاتك 3x وتوفير 50% من وقتك
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="space-y-3 text-center">
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {feature.title}
                  </h3>
                  {feature.stat && (
                    <div className="text-sm text-primary font-semibold mb-2">
                      {feature.stat}
                    </div>
                  )}
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
