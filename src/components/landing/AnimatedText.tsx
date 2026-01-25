"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  stagger?: number
}

export function AnimatedText({
  text,
  className = "",
  delay = 0,
  duration = 0.5,
  stagger = 0.02,
}: AnimatedTextProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true)
    }
  }, [isInView, hasAnimated])

  const letters = text.split("")

  return (
    <div ref={ref} className={`inline-block ${className}`}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={
            hasAnimated
              ? {
                  opacity: 1,
                  y: 0,
                }
              : { opacity: 0, y: 20 }
          }
          transition={{
            duration,
            delay: delay + index * stagger,
            ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuart
          }}
          className="inline-block"
          style={{ willChange: "transform, opacity" }}
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </div>
  )
}
