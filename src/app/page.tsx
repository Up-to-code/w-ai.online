"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import {
  MessageSquare,
  ArrowRight,
  Star,
  CheckCircle2,
  TrendingUp,
  Zap,
  ShoppingBag,
  Link2,
  Bot,
  BarChart3,
} from "lucide-react"
import { useUserContext } from "@/hooks/useUserContext"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AnimatedCounter } from "@/components/landing/AnimatedCounter"

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

// Number formatting utility
function formatNumber(num: number): string {
  if (num >= 1000000) {
    const millions = num / 1000000
    if (millions >= 10) {
      return `${Math.floor(millions)}M+`
    }
    return `${millions.toFixed(1)}M+`
  }
  if (num >= 1000) {
    const thousands = num / 1000
    if (thousands >= 10) {
      return `${Math.floor(thousands)}K+`
    }
    return `${thousands.toFixed(1)}K+`
  }
  return num.toString()
}

// Animated number with K/M formatting
function AnimatedFormattedNumber({ value, duration = 2000, className = "" }: { value: number; duration?: number; className?: string }) {
  if (!value && value !== 0) return <span className={className}>--</span>
  
  if (value >= 1000000) {
    const millions = value / 1000000
    const displayValue = millions >= 10 ? Math.floor(millions) : parseFloat(millions.toFixed(1))
    return (
      <AnimatedCounter
        value={displayValue}
        duration={duration}
        className={className}
        decimals={millions >= 10 ? 0 : 1}
        suffix="M+"
      />
    )
  }
  if (value >= 1000) {
    const thousands = value / 1000
    const displayValue = thousands >= 10 ? Math.floor(thousands) : parseFloat(thousands.toFixed(1))
    return (
      <AnimatedCounter
        value={displayValue}
        duration={duration}
        className={className}
        decimals={thousands >= 10 ? 0 : 1}
        suffix="K+"
      />
    )
  }
  return (
    <AnimatedCounter
      value={value}
      duration={duration}
      className={className}
    />
  )
}

export default function LandingPage() {
  const { isLoading, isAuthenticated } = useUserContext()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  
  // Fetch public stats
  const publicStats = useQuery(api.publicStats.getPublicStats)

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
      question: "هل هناك نسخة تجريبية مجانية؟",
      answer: "نعم، يمكنك البدء مجاناً بدون بطاقة ائتمان. جرب جميع المميزات لمدة 14 يوماً.",
    },
    {
      question: "كم من الوقت أحتاج للبدء؟",
      answer: "يمكنك البدء في أقل من 5 دقائق. ربط حساب واتساب للأعمال سهل جداً.",
    },
    {
      question: "هل يمكنني إلغاء الاشتراك في أي وقت؟",
      answer: "نعم، يمكنك إلغاء الاشتراك في أي وقت بدون رسوم إضافية.",
    },
    {
      question: "ما هي طرق الدفع المقبولة؟",
      answer: "نقبل جميع بطاقات الائتمان الرئيسية وندعم المدفوعات بالريال السعودي.",
    },
    {
      question: "هل بياناتي آمنة؟",
      answer: "نعم، نستخدم تشفير SSL ونتابع أعلى معايير الأمان لحماية بياناتك.",
    },
    {
      question: "كيف يمكنني الحصول على الدعم؟",
      answer: "نوفر دعم فني على مدار الساعة عبر البريد الإلكتروني والدردشة المباشرة.",
    },
  ]

  const testimonials = [
    {
      text: "زادت مبيعاتنا بنسبة 40% بعد استخدام المنصة. الردود التلقائية ساعدتنا على استقبال طلبات أكثر بكثير.",
      author: "أحمد محمد",
      company: "متجر إلكتروني",
      rating: 5,
      result: "40% زيادة في المبيعات",
    },
    {
      text: "وفرنا 20 ساعة أسبوعياً. الأتمتة الذكية تعمل لنا 24/7 بدون توقف.",
      author: "فاطمة علي",
      company: "شركة تجارية",
      rating: 5,
      result: "20 ساعة توفير أسبوعياً",
    },
    {
      text: "زمن الاستجابة انخفض من 5 دقائق إلى 30 ثانية. عملاؤنا سعداء جداً.",
      author: "خالد سعيد",
      company: "مؤسسة",
      rating: 5,
      result: "30 ثانية وقت رد",
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
            ابدأ مجاناً الآن
          </Button>
        </nav>
      </header>

      {/* Hero Section - Sales-Focused */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-4 md:px-6 bg-background">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-10"
          >
            {/* Trust Signal */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-sm text-muted-foreground"
            >
              {publicStats ? (
                <>موثوق به من قبل أكثر من {formatNumber(publicStats.activeOrganizations || publicStats.totalOrganizations)} شركة</>
              ) : (
                <>موثوق به من قبل آلاف الشركات</>
              )}
            </motion.p>

            {/* Headline */}
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-foreground leading-tight"
              >
                نمّي عملك. زد مبيعاتك.
                <br />
                <span className="text-primary">واتساب يرد. سلة تربط. كل شيء يعمل.</span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
              >
                واتساب يرد على العملاء تلقائياً. سلة تربط منتجاتك. المحادثات تدير نفسها. المبيعات تزيد وحدها.
              </motion.p>
            </div>

            {/* Prominent Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 md:gap-16 pt-6"
            >
              <div className="text-center">
                {publicStats ? (
                  <>
                    <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">
                      <AnimatedFormattedNumber
                        value={publicStats.totalMessages}
                        duration={2000}
                      />
                    </div>
                    <div className="text-sm md:text-base text-muted-foreground mt-2">رسالة مرسلة</div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground animate-pulse">--</div>
                    <div className="text-sm md:text-base text-muted-foreground mt-2">رسالة مرسلة</div>
                  </>
                )}
              </div>
              <div className="w-px h-16 bg-border hidden md:block"></div>
              <div className="text-center">
                <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">50%</div>
                <div className="text-sm md:text-base text-muted-foreground mt-2">توفير الوقت</div>
              </div>
              <div className="w-px h-16 bg-border hidden md:block"></div>
              <div className="text-center">
                {publicStats ? (
                  <>
                    <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground">
                      <AnimatedCounter
                        value={publicStats.averageDeliveryRate}
                        duration={2000}
                        suffix="%"
                      />
                    </div>
                    <div className="text-sm md:text-base text-muted-foreground mt-2">معدل التسليم</div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground animate-pulse">--</div>
                    <div className="text-sm md:text-base text-muted-foreground mt-2">معدل التسليم</div>
                  </>
                )}
              </div>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="pt-6"
            >
              <Button
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="text-lg px-12 py-8 bg-primary hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
              >
                ابدأ مجاناً الآن - وفر 50% من وقتك
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <div>
              <h3 className="text-lg md:text-xl text-muted-foreground mb-6">
                موثوق به من قبل آلاف الشركات
              </h3>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                <div className="text-center">
                  {publicStats ? (
                    <>
                      <div className="text-4xl md:text-5xl font-bold text-foreground">
                        <AnimatedFormattedNumber
                          value={publicStats.activeOrganizations || publicStats.totalOrganizations}
                          duration={2000}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">شركة</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl md:text-5xl font-bold text-foreground animate-pulse">--</div>
                      <div className="text-sm text-muted-foreground mt-1">شركة</div>
                    </>
                  )}
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  {publicStats ? (
                    <>
                      <div className="text-4xl md:text-5xl font-bold text-foreground">
                        <AnimatedFormattedNumber
                          value={publicStats.totalMessages}
                          duration={2000}
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">رسالة مرسلة</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl md:text-5xl font-bold text-foreground animate-pulse">--</div>
                      <div className="text-sm text-muted-foreground mt-1">رسالة مرسلة</div>
                    </>
                  )}
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  {publicStats ? (
                    <>
                      <div className="text-4xl md:text-5xl font-bold text-foreground">
                        <AnimatedCounter
                          value={publicStats.averageDeliveryRate}
                          duration={2000}
                          suffix="%"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">معدل التسليم</div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl md:text-5xl font-bold text-foreground animate-pulse">--</div>
                      <div className="text-sm text-muted-foreground mt-1">معدل التسليم</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Integration Icons Section */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              اربط منصاتك المفضلة
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              تكامل سهل مع أكبر المنصات
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <div className="text-center p-6 rounded-xl bg-muted/30">
              <div className="w-16 h-16 rounded-xl bg-[#004D3D] flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">سلة</h3>
              <p className="text-sm text-muted-foreground">اربط متجرك الإلكتروني</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-muted/30">
              <div className="w-16 h-16 rounded-xl bg-[#128C7E] flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">واتساب</h3>
              <p className="text-sm text-muted-foreground">واتساب للأعمال</p>
            </div>
            <div className="text-center p-6 rounded-xl bg-muted/30">
              <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
                <Link2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">تكاملات أخرى</h3>
              <p className="text-sm text-muted-foreground">اربط منصاتك بسهولة</p>
            </div>
          </motion.div>
        </div>
      </section>

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

      {/* How It Works Section */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              كيف يعمل
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ابدأ في 4 خطوات بسيطة
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
          >
            {[
              {
                number: 1,
                title: "اربط حسابك",
                description: "اتصل بواتساب للأعمال في دقائق",
                icon: Link2,
              },
              {
                number: 2,
                title: "أضف منتجاتك",
                description: "اربط مع سلة أو أضف منتجاتك يدوياً",
                icon: ShoppingBag,
              },
              {
                number: 3,
                title: "أتمت الردود",
                description: "ذكاء اصطناعي يرد على العملاء تلقائياً",
                icon: Bot,
              },
              {
                number: 4,
                title: "راقب النتائج",
                description: "تتبع المبيعات والأداء في الوقت الفعلي",
                icon: BarChart3,
              },
            ].map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Phone Mockup - See It Work */}
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

      {/* Numbers Showcase Section */}
      <section className="py-24 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              أرقام تتحدث عن نفسها
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
          >
            <div className="text-center">
              {publicStats ? (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2">
                    <AnimatedFormattedNumber
                      value={publicStats.totalMessages}
                      duration={2000}
                    />
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground">رسالة مرسلة</div>
                </>
              ) : (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2 animate-pulse">--</div>
                  <div className="text-sm md:text-base text-muted-foreground">رسالة مرسلة</div>
                </>
              )}
            </div>
            <div className="text-center">
              {publicStats ? (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2">
                    <AnimatedFormattedNumber
                      value={publicStats.activeOrganizations || publicStats.totalOrganizations}
                      duration={2000}
                    />
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground">شركة نشطة</div>
                </>
              ) : (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2 animate-pulse">--</div>
                  <div className="text-sm md:text-base text-muted-foreground">شركة نشطة</div>
                </>
              )}
            </div>
            <div className="text-center">
              {publicStats ? (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2">
                    <AnimatedFormattedNumber
                      value={publicStats.totalCampaigns}
                      duration={2000}
                    />
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground">حملة</div>
                </>
              ) : (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2 animate-pulse">--</div>
                  <div className="text-sm md:text-base text-muted-foreground">حملة</div>
                </>
              )}
            </div>
            <div className="text-center">
              {publicStats ? (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2">
                    <AnimatedCounter
                      value={publicStats.averageDeliveryRate}
                      duration={2000}
                      suffix="%"
                    />
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground">معدل التسليم</div>
                </>
              ) : (
                <>
                  <div className="text-5xl md:text-6xl lg:text-7xl font-bold text-primary mb-2 animate-pulse">--</div>
                  <div className="text-sm md:text-base text-muted-foreground">معدل التسليم</div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials - Success Stories */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              نتائج حقيقية من عملائنا
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="rounded-xl p-6 bg-muted/30"
              >
                <div className="space-y-4">
                  {testimonial.result && (
                    <div className="text-2xl font-bold text-primary mb-2">
                      {testimonial.result}
                    </div>
                  )}
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

      {/* Pricing - Sales-Focused */}
      <section className="py-24 md:py-32 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              خطط تناسب كل احتياج
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              ابدأ مجاناً وارتقِ حسب نمو عملك
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          >
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`h-full rounded-xl p-6 transition-all duration-300 ${
                  plan.popular
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-background"
                }`}
              >
                {plan.popular && (
                  <div className="text-center mb-3">
                    <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
                      الأكثر شعبية
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className={`text-xl font-bold mb-4 ${plan.popular ? "text-white" : ""}`}>
                    {plan.name}
                  </h3>
                  <div className="mb-2">
                    <span className={`text-4xl font-bold ${plan.popular ? "text-white" : ""}`}>
                      {plan.price}
                    </span>
                    <span className={`mr-2 ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>
                      {" "}
                      {plan.currency}
                    </span>
                  </div>
                  <span className={`text-sm ${plan.popular ? "text-white/80" : "text-muted-foreground"}`}>
                    /شهر
                  </span>
                </div>
                <ul className="space-y-3 text-right mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className={`h-5 w-5 shrink-0 mt-0.5 ${plan.popular ? "text-white" : "text-primary"}`} />
                      <span className={`text-sm ${plan.popular ? "text-white/90" : ""}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "secondary" : "default"}
                  onClick={() => router.push("/dashboard")}
                >
                  {plan.price === 0 ? "ابدأ مجاناً الآن" : "اختر الخطة وابدأ"}
                </Button>
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* FAQ - Your Questions */}
      <section className="py-24 md:py-32 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              أسئلة شائعة
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

      {/* Final CTA - Sales-Focused */}
      <section className="py-24 md:py-32 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              ابدأ الآن ووفر 50% من وقتك
            </h2>
            <p className="text-xl md:text-2xl text-primary-foreground/90">
              {publicStats ? (
                <>
                  انضم إلى أكثر من{" "}
                  <AnimatedFormattedNumber
                    value={publicStats.activeOrganizations || publicStats.totalOrganizations}
                    duration={2000}
                  />{" "}
                  شركة تستخدم منصتنا
                </>
              ) : (
                <>انضم إلى آلاف الشركات تستخدم منصتنا</>
              )}
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="text-lg px-12 py-8 bg-white text-primary hover:bg-white/90 transition-opacity shadow-xl"
              >
                ابدأ مجاناً الآن - لا تفوت الفرصة
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </div>
            <p className="text-sm text-primary-foreground/80">
              بدون بطاقة ائتمان • إلغاء في أي وقت • دعم 24/7 • ابدأ في 5 دقائق
            </p>
          </motion.div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground mb-2">w-ai.online</div>
            <div className="text-sm text-muted-foreground">
              © 2024 w-ai.online. جميع الحقوق محفوظة.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
