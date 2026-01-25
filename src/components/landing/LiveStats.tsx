"use client"

import { memo } from "react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"
import { AnimatedCounter } from "./AnimatedCounter"
import { MessageSquare, Users, BarChart3, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

export const LiveStats = memo(function LiveStats() {
  const stats = useQuery(api.publicStats.getPublicStats)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  if (!stats) {
    return null
  }

  const statItems = [
    {
      icon: MessageSquare,
      label: "رسالة مرسلة",
      value: stats.totalMessages,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      icon: BarChart3,
      label: "حملة نشطة",
      value: stats.totalCampaigns,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
    {
      icon: Users,
      label: "جهة اتصال",
      value: stats.totalContacts,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
    },
    {
      icon: TrendingUp,
      label: "معدل الوصول",
      value: stats.averageDeliveryRate,
      suffix: "%",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
    },
  ]

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
            أرقام حقيقية من منصتنا
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            إحصائيات مباشرة من عملائنا حول العالم
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
            {statItems.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex-1 w-full">
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-border last:border-0 md:border-0 md:pb-0">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 ${item.color} opacity-60`} />
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground">
                      <AnimatedCounter
                        value={item.value}
                        suffix={item.suffix}
                        duration={2000}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
})
