"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

interface RegionData {
  name: string
  users: number
  messages: number
}

// Regional data matching the image
const regionData: RegionData[] = [
  { name: "مصر", users: 1200, messages: 41000 },
  { name: "الإمارات", users: 850, messages: 32000 },
  { name: "السعودية", users: 1250, messages: 45000 },
  { name: "المغرب", users: 680, messages: 25000 },
  { name: "الكويت", users: 320, messages: 12000 },
  { name: "الأردن", users: 450, messages: 15000 },
]

export const WorldMap = memo(function WorldMap() {
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
            نصل إلى عملائك في جميع أنحاء العالم
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            منصة موثوقة تستخدمها الشركات في مختلف المناطق
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-5xl mx-auto space-y-12"
        >
          {/* Abstract Green Graphic - More Defined */}
          <div className="relative h-64 md:h-80 w-full flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* More defined organic shapes with less blur */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 md:w-96 md:h-96 rounded-[45%] bg-gradient-to-br from-green-600 via-green-700 to-green-800 opacity-70 blur-xl"
                  style={{ borderRadius: "45% 55% 40% 60%" }}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-64 md:w-72 md:h-80 rounded-[50%] bg-gradient-to-br from-green-500 via-green-600 to-green-700 opacity-60 blur-lg"
                  style={{ 
                    transform: "translate(-48%, -52%)",
                    borderRadius: "50% 50% 45% 55%"
                  }}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-56 md:w-80 md:h-72 rounded-[55%] bg-gradient-to-br from-green-400 via-green-500 to-green-600 opacity-50 blur-md"
                  style={{ 
                    transform: "translate(-52%, -48%)",
                    borderRadius: "55% 45% 50% 50%"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Data Cards Grid - 2x3 with Image Styling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-6"
          >
            {regionData.map((region) => (
              <div
                key={region.name}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 shadow-sm text-right"
              >
                <div className="font-semibold text-foreground mb-2 text-base">{region.name}</div>
                <div className="text-sm text-muted-foreground mb-1">
                  {region.users.toLocaleString()} مستخدم
                </div>
                <div className="text-xs text-muted-foreground">
                  {region.messages.toLocaleString()} رسالة
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
})
