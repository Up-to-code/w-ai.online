"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"

export const SocialProof = memo(function SocialProof() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-16 bg-muted/20">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4"
        >
          <p className="text-sm text-muted-foreground font-medium">
            موثوق به من قبل آلاف الشركات
          </p>
          <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap opacity-60">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-8 w-24 bg-muted rounded flex items-center justify-center"
              >
                <span className="text-xs text-muted-foreground">شركة {i}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
})
