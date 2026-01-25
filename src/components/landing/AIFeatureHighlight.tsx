"use client"

import { memo } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Bot, Zap, Globe, Brain, ArrowRight } from "lucide-react"
import { AnimatedCounter } from "./AnimatedCounter"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const aiFeatures = [
  {
    icon: Brain,
    title: "فهم السياق",
    description: "يفهم المحادثات والسياق بشكل عميق",
  },
  {
    icon: Zap,
    title: "ردود فورية",
    description: "استجابة سريعة في أقل من ثانية",
  },
  {
    icon: Globe,
    title: "متعدد اللغات",
    description: "يدعم العربية والإنجليزية والمزيد",
  },
]

export const AIFeatureHighlight = memo(function AIFeatureHighlight() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const router = useRouter()

  return (
    <section ref={ref} className="py-32 bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center space-y-12"
        >
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              ذكاء اصطناعي قوي
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              أكثر من 10 مليون رمز لاستجابة ذكية
            </p>
          </div>

          {/* Token Counter */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-center gap-2">
              <AnimatedCounter
                value={10000000}
                className="text-6xl md:text-7xl font-bold text-foreground"
              />
              <span className="text-3xl md:text-4xl font-semibold text-foreground">+</span>
            </div>
            <p className="text-lg text-muted-foreground">رمز متاح</p>
            <p className="text-sm text-muted-foreground">ابدأ من 999 ريال/شهر</p>
          </div>

          {/* Features Horizontal */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 pt-8">
            {aiFeatures.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center space-y-2">
                  <Icon className="h-5 w-5 text-primary mx-auto opacity-60" />
                  <h3 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div className="pt-8">
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="text-lg px-8 py-6 bg-primary hover:opacity-90 transition-opacity"
            >
              جرب الذكاء الاصطناعي الآن
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
})
