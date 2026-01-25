"use client"

import { memo } from "react"
import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"
import { MessageSquare, BarChart3, Users, Zap } from "lucide-react"

const demoFeatures = [
  {
    icon: MessageSquare,
    title: "إدارة المحادثات",
    description: "أدار جميع محادثات واتساب من مكان واحد",
  },
  {
    icon: BarChart3,
    title: "تحليلات فورية",
    description: "تتبع الأداء مع تقارير مفصلة في الوقت الفعلي",
  },
  {
    icon: Users,
    title: "إدارة العملاء",
    description: "نظم جهات الاتصال مع معلومات شاملة",
  },
  {
    icon: Zap,
    title: "أتمتة ذكية",
    description: "أتمت الردود والمهام المتكررة تلقائياً",
  },
]

export const DemoPreview = memo(function DemoPreview() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [activeFeature, setActiveFeature] = useState(0)

  return (
    <section ref={ref} className="py-20 bg-muted/20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            جرب المنصة بنفسك
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            استكشف المميزات القوية التي تجعل عملك أكثر كفاءة
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            {demoFeatures.map((feature, index) => {
              const Icon = feature.icon
              const isActive = activeFeature === index
              return (
                <motion.button
                  key={index}
                  onClick={() => setActiveFeature(index)}
                  whileHover={{ x: 8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className={`w-full text-right p-4 rounded-xl border transition-all duration-300 ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border bg-background hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative"
          >
            <div className="border border-border rounded-2xl bg-background p-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <div className="h-8 bg-muted rounded-lg w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="h-24 bg-muted/50 rounded-lg"></div>
                      <div className="h-24 bg-muted/50 rounded-lg"></div>
                    </div>
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg mt-4"></div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
