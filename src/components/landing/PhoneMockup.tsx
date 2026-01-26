"use client"

import { memo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { BarChart3, MessageSquare, Zap } from "lucide-react"

const screens = [
  {
    id: "dashboard",
    title: "لوحة التحكم",
    icon: BarChart3,
    content: (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 rounded-[12px] p-3">
            <div className="text-xs text-muted-foreground mb-1">الرسائل</div>
            <div className="text-lg font-bold text-foreground">12.5K</div>
            <div className="text-xs text-primary mt-1">↑ 23%</div>
          </div>
          <div className="bg-primary/10 rounded-[12px] p-3">
            <div className="text-xs text-muted-foreground mb-1">الحملات</div>
            <div className="text-lg font-bold text-foreground">48</div>
            <div className="text-xs text-primary mt-1">نشطة</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs font-semibold text-foreground">الأداء الأسبوعي</div>
          <div className="h-24 bg-muted/30 rounded-[12px] flex items-end gap-1 p-2">
            {[65, 80, 45, 90, 70, 85, 75].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-t transition-all"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "chat",
    title: "المحادثات",
    icon: MessageSquare,
    content: (
      <div className="space-y-3 p-4">
        <div className="flex gap-2 items-start">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted rounded-[12px] p-2.5">
              <div className="h-2 bg-foreground/20 rounded w-3/4 mb-1.5" />
              <div className="h-2 bg-foreground/20 rounded w-1/2" />
            </div>
            <div className="text-xs text-muted-foreground">10:30 ص</div>
          </div>
        </div>
        <div className="flex gap-2 items-start justify-end">
          <div className="flex-1 space-y-2">
            <div className="bg-primary rounded-[12px] p-2.5 ml-auto max-w-[80%]">
              <div className="h-2 bg-white/90 rounded w-full mb-1.5" />
              <div className="h-2 bg-white/90 rounded w-2/3" />
            </div>
            <div className="text-xs text-muted-foreground text-left">10:31 ص</div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0" />
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="bg-muted rounded-[12px] p-2.5">
              <div className="h-2 bg-foreground/20 rounded w-2/3 mb-1.5" />
              <div className="h-2 bg-foreground/20 rounded w-1/2" />
            </div>
            <div className="text-xs text-muted-foreground">10:32 ص</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "campaigns",
    title: "الحملات",
    icon: Zap,
    content: (
      <div className="space-y-3 p-4">
        <div className="bg-muted/30 rounded-[12px] p-3 border-r-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 bg-foreground/30 rounded w-24" />
            <div className="h-2 bg-primary/50 rounded w-12" />
          </div>
          <div className="h-2 bg-foreground/10 rounded w-full mb-1" />
          <div className="h-2 bg-foreground/10 rounded w-3/4" />
        </div>
        <div className="bg-muted/30 rounded-[12px] p-3 border-r-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 bg-foreground/30 rounded w-28" />
            <div className="h-2 bg-primary/50 rounded w-16" />
          </div>
          <div className="h-2 bg-foreground/10 rounded w-full mb-1" />
          <div className="h-2 bg-foreground/10 rounded w-2/3" />
        </div>
        <div className="bg-muted/30 rounded-[12px] p-3 border-r-4 border-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 bg-foreground/30 rounded w-20" />
            <div className="h-2 bg-primary/50 rounded w-10" />
          </div>
          <div className="h-2 bg-foreground/10 rounded w-full mb-1" />
          <div className="h-2 bg-foreground/10 rounded w-4/5" />
        </div>
      </div>
    ),
  },
]

export const PhoneMockup = memo(function PhoneMockup() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [currentScreen, setCurrentScreen] = useState(0)

  useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [isInView])

  const currentScreenData = screens[currentScreen]
  const Icon = currentScreenData.icon

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
            شاهد كيف يعمل
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            منصة شاملة في راحة يدك
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center"
        >
          {/* Phone Frame */}
          <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl">
            {/* Notch */}
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>

            {/* Side buttons */}
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>

            {/* Screen Content */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background relative flex flex-col">
              {/* Header */}
              <div className="bg-primary p-4 pt-12 flex items-center gap-3 text-white z-10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{currentScreenData.title}</div>
                </div>
              </div>

              {/* Screen Content with Animation */}
              <div className="flex-1 overflow-hidden bg-muted/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentScreen}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full"
                  >
                    {currentScreenData.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Screen Indicators */}
              <div className="flex items-center justify-center gap-2 p-4 bg-background border-t border-border">
                {screens.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreen(index)}
                    className={`h-2 rounded-full transition-all ${index === currentScreen
                        ? "w-8 bg-primary"
                        : "w-2 bg-muted-foreground/30"
                      }`}
                    aria-label={`Go to ${screens[index].title}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
})
