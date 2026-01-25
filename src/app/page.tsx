"use client"

import { useState, useEffect, lazy, Suspense, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useInView, AnimatePresence } from "framer-motion"
import {
  MessageSquare,
  ArrowRight,
  Star,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react"
import { useUserContext } from "@/hooks/useUserContext"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Lazy load components below the fold for better performance
const FeatureShowcase = lazy(() =>
  import("@/components/landing/FeatureShowcase").then((mod) => ({
    default: mod.FeatureShowcase,
  }))
)
const PhoneMockup = lazy(() =>
  import("@/components/landing/PhoneMockup").then((mod) => ({
    default: mod.PhoneMockup,
  }))
)

// Chat messages data
const chatMessages = [
  {
    id: 1,
    type: "customer",
    text: "هل متوفر المنتج X؟",
    delay: 0.3,
  },
  {
    id: 2,
    type: "ai",
    text: "نعم، متوفر حالياً",
    details: ["السعر: 299 ريال", "المواصفات: شاشة 6.1 بوصة، 128GB"],
    delay: 0.8,
  },
  {
    id: 3,
    type: "customer",
    text: "ما هي الألوان المتوفرة؟",
    delay: 1.5,
  },
  {
    id: 4,
    type: "ai",
    text: "متوفر بألوان:",
    details: ["• أسود", "• أبيض", "• أنيق"],
    delay: 2.0,
  },
  {
    id: 5,
    type: "customer",
    text: "ممتاز! كيف أطلب؟",
    delay: 2.7,
  },
  {
    id: 6,
    type: "ai",
    text: "يمكنك الطلب مباشرة من خلال الرابط التالي...",
    delay: 3.2,
  },
]

function ChatPhoneMockup() {
  const chatRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [visibleMessages, setVisibleMessages] = useState<number[]>([])
  const [showTyping, setShowTyping] = useState(false)

  // Animate messages appearing one by one
  useEffect(() => {
    if (!isInView) return

    const timeouts: NodeJS.Timeout[] = []

    chatMessages.forEach((message, index) => {
      const timeout = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, message.id])
        
        // Show typing indicator before AI responses
        if (message.type === "ai" && index < chatMessages.length - 1) {
          setShowTyping(true)
          setTimeout(() => {
            setShowTyping(false)
          }, 500)
        }
      }, message.delay * 1000)

      timeouts.push(timeout)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isInView])

  // Auto-scroll to bottom when new messages appear
  useEffect(() => {
    if (chatRef.current && visibleMessages.length > 0) {
      const scrollToBottom = () => {
        if (chatRef.current) {
          chatRef.current.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: "smooth",
          })
        }
      }
      
      // Small delay to ensure message is rendered
      const timeout = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeout)
    }
  }, [visibleMessages])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -20, scale: 0.95 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex justify-center items-center order-2 lg:order-1"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={isInView ? { scale: 1 } : { scale: 0.95 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-2xl"
        style={{
          boxShadow: isInView
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)"
            : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-background relative flex flex-col">
          {/* WhatsApp Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-primary p-3 pt-10 flex items-center gap-2 text-white"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={isInView ? { scale: 1 } : { scale: 0 }}
              transition={{ duration: 0.3, delay: 0.2, type: "spring" }}
              className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0"
            />
            <div className="text-sm font-semibold">عميل</div>
          </motion.div>
          
          {/* Chat Messages */}
          <div
            ref={chatRef}
            className="flex-1 p-4 space-y-3 bg-muted/5 overflow-y-auto chat-scrollbar"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(0, 0, 0, 0.2) transparent",
            }}
          >
            <AnimatePresence>
              {chatMessages.map((message) => {
                const isVisible = visibleMessages.includes(message.id)
                const isCustomer = message.type === "customer"

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={
                      isVisible
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: 20, scale: 0.9 }
                    }
                    transition={{
                      duration: 0.4,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: isVisible ? 0 : 0,
                    }}
                    className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      className={`rounded-lg p-3 max-w-[80%] shadow-sm ${
                        isCustomer
                          ? "bg-primary/20 rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      }`}
                    >
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm text-foreground mb-2"
                      >
                        {message.text}
                      </motion.p>
                      {message.details && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="space-y-1 text-xs text-muted-foreground"
                        >
                          {message.details.map((detail, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -5 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + idx * 0.1 }}
                            >
                              {detail}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {showTyping && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-start"
                >
                  <div className="bg-muted rounded-lg rounded-bl-sm p-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-primary/60 rounded-full"
                          animate={{
                            y: [0, -8, 0],
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function LandingPage() {
  const { isLoading, isAuthenticated } = useUserContext()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Show loading while checking authentication
  if (isLoading) {
    return null
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    return null
  }

  const pricingPlans = [
    {
      name: "مجاني",
      price: 0,
      currency: "ريال",
      features: [
        "حتى 1,000 رسالة/شهر",
        "وكيل ذكاء اصطناعي أساسي",
        "إدارة الحملات",
        "دعم عبر البريد",
      ],
      popular: false,
    },
    {
      name: "بدء التشغيل",
      price: 69,
      currency: "ريال",
      features: [
        "حتى 5,000 رسالة/شهر",
        "وكيل ذكاء اصطناعي متقدم",
        "حملات غير محدودة",
        "دعم أولوية",
        "أتمتة مخصصة",
      ],
      popular: false,
    },
    {
      name: "احترافي",
      price: 199,
      currency: "ريال",
      features: [
        "حتى 50,000 رسالة/شهر",
        "أكثر من 10 مليون رمز للذكاء الاصطناعي",
        "وكيل ذكاء اصطناعي متقدم",
        "حملات غير محدودة",
        "دعم أولوية",
        "أتمتة مخصصة",
        "تحليلات متقدمة",
      ],
      popular: true,
    },
    {
      name: "مؤسسي",
      price: 999,
      currency: "ريال",
      features: [
        "رسائل غير محدودة",
        "أكثر من 10 مليون رمز للذكاء الاصطناعي",
        "وكيل ذكاء اصطناعي متميز",
        "مدير حساب مخصص",
        "دعم 24/7",
        "تكاملات مخصصة",
        "تحليلات متقدمة",
      ],
      popular: false,
    },
  ]

  const faqs = [
    {
      question: "كيف يمكنني ربط حساب واتساب للأعمال؟",
      answer: "يمكنك ربط حساب واتساب للأعمال من خلال صفحة التكاملات. سنرشدك خلال عملية OAuth.",
    },
    {
      question: "ما هي طرق الدفع المقبولة؟",
      answer: "نقبل جميع بطاقات الائتمان الرئيسية وندعم المدفوعات بالريال السعودي.",
    },
    {
      question: "هل يمكنني إلغاء الاشتراك في أي وقت؟",
      answer: "نعم، يمكنك إلغاء الاشتراك في أي وقت من صفحة الإعدادات.",
    },
    {
      question: "هل هناك نسخة تجريبية مجانية؟",
      answer: "نعم، نقدم نسخة تجريبية مجانية لمدة 14 يوماً لجميع المستخدمين الجدد.",
    },
  ]

  const testimonials = [
    {
      text: "لقد غيرت هذه المنصة طريقة تعاملنا مع خدمة العملاء. وكيل الذكاء الاصطناعي يفهم السياق بشكل مثالي وزمن الاستجابة لدينا تحسن بشكل كبير.",
      author: "أحمد محمد",
      company: "متجر إلكتروني",
      rating: 5,
    },
    {
      text: "أفضل استثمار قمنا به هذا العام. الحملات التلقائية ووكيل الذكاء الاصطناعي وفرا لنا ساعات من العمل اليومي.",
      author: "فاطمة علي",
      company: "شركة تجارية",
      rating: 5,
    },
    {
      text: "منصة احترافية وسهلة الاستخدام. فريق الدعم سريع الاستجابة والمنصة مستقرة تماماً.",
      author: "خالد سعيد",
      company: "مؤسسة",
      rating: 5,
    },
  ]

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Minimal Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background/95 backdrop-blur-sm border-b border-border" : "bg-background"
        }`}
      >
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-foreground">
            w-ai.online
          </div>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-primary hover:opacity-90 transition-opacity"
          >
            ابدأ مجاناً
          </Button>
        </nav>
      </header>

      {/* Hero Section - Text Only */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 md:px-6 bg-background">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center space-y-8"
          >
            {/* Headline */}
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight"
              >
                توقف عن إضاعة الوقت.
                <br />
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="text-primary"
                >
                  أتمت واتساب للأعمال الآن
                </motion.span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
              >
                منصة واحدة تحل كل مشاكلك. وفر الوقت وزد المبيعات. اربط مع متجرك الإلكتروني وأتمت الردود على المنتجات.
              </motion.p>
            </div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center gap-12 pt-8"
            >
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">10M+</div>
                <div className="text-sm text-muted-foreground mt-1">رمز AI</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">50%</div>
                <div className="text-sm text-muted-foreground mt-1">توفير الوقت</div>
              </div>
              <div className="w-px h-12 bg-border"></div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-foreground">300%</div>
                <div className="text-sm text-muted-foreground mt-1">زيادة الاستجابة</div>
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="pt-8"
            >
              <Button
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="text-lg px-12 py-8 bg-primary hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
              >
                ابدأ مجاناً
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Phone Showcase - See It Work */}
      <Suspense
        fallback={
          <section className="py-32 bg-background">
            <div className="container mx-auto px-4 md:px-6">
              <div className="text-center mb-16">
                <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
              </div>
              <div className="flex justify-center">
                <div className="h-[600px] w-[300px] bg-muted/5 rounded-[2.5rem] animate-pulse"></div>
              </div>
            </div>
          </section>
        }
      >
        <PhoneMockup />
      </Suspense>

      {/* Features - What You Get */}
      <Suspense
        fallback={
          <section className="py-20">
            <div className="container mx-auto px-4">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-2xl p-6 bg-background animate-pulse"
                  >
                    <div className="h-12 w-12 rounded-xl bg-muted mb-4"></div>
                    <div className="h-6 bg-muted rounded w-32 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full mb-1"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }
      >
        <FeatureShowcase />
      </Suspense>


      {/* Testimonials - Success Stories */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              ماذا يقول عملاؤنا
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              آلاف الشركات تثق بنا
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="border border-border rounded-xl p-6 bg-background hover:border-primary/50 transition-colors"
              >
                <div className="space-y-4">
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star
                        key={j}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed text-right">
                    "{testimonial.text}"
                  </p>
                  <div className="pt-4 border-t border-border space-y-1 text-right">
                    <div className="font-semibold text-foreground">
                      {testimonial.author}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* Pricing - Choose Your Path */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              الأسعار
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              اختر الخطة المناسبة
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
          >
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`h-full rounded-xl p-6 transition-all duration-300 ${
                  plan.popular
                    ? "bg-muted/30"
                    : "bg-background"
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-4">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground mr-2">
                      {" "}
                      {plan.currency}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">/شهر</span>
                </div>
                <ul className="space-y-3 text-right mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => router.push("/dashboard")}
                >
                  {plan.price === 0 ? "ابدأ مجاناً" : "اختر الخطة"}
                </Button>
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* FAQ - Your Questions */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              الأسئلة الشائعة
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="w-full" dir="rtl">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-right">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-right text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Start Your Journey */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8 max-w-2xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              جاهز للبدء؟
            </h2>
            <p className="text-lg text-muted-foreground">
              انضم إلى آلاف الشركات
            </p>
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="text-lg px-12 py-8 bg-primary hover:opacity-90 transition-opacity"
            >
              ابدأ النسخة التجريبية المجانية
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h3 className="font-bold text-lg">w-ai.online</h3>
              <p className="text-sm text-muted-foreground">
                أتمتة واتساب للأعمال مدعومة بالذكاء الاصطناعي.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link
                href="/#features"
                className="text-muted-foreground hover:opacity-70 transition-opacity"
              >
                المميزات
              </Link>
              <Link
                href="/#pricing"
                className="text-muted-foreground hover:opacity-70 transition-opacity"
              >
                الأسعار
              </Link>
              <Link
                href="/about"
                className="text-muted-foreground hover:opacity-70 transition-opacity"
              >
                من نحن
              </Link>
              <Link
                href="/contact"
                className="text-muted-foreground hover:opacity-70 transition-opacity"
              >
                اتصل بنا
              </Link>
              <Link
                href="/privacy"
                className="text-muted-foreground hover:opacity-70 transition-opacity"
              >
                سياسة الخصوصية
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:opacity-70 transition-opacity"
              >
                شروط الخدمة
              </Link>
            </div>
            <div className="pt-8 border-t text-sm text-muted-foreground">
              © 2024 w-ai.online. جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
