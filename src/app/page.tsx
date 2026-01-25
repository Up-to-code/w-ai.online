"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
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
const LiveStats = lazy(() =>
  import("@/components/landing/LiveStats").then((mod) => ({
    default: mod.LiveStats,
  }))
)
const FeatureShowcase = lazy(() =>
  import("@/components/landing/FeatureShowcase").then((mod) => ({
    default: mod.FeatureShowcase,
  }))
)
const AIFeatureHighlight = lazy(() =>
  import("@/components/landing/AIFeatureHighlight").then((mod) => ({
    default: mod.AIFeatureHighlight,
  }))
)
const WorldMap = lazy(() =>
  import("@/components/landing/WorldMap").then((mod) => ({
    default: mod.WorldMap,
  }))
)
const PhoneMockup = lazy(() =>
  import("@/components/landing/PhoneMockup").then((mod) => ({
    default: mod.PhoneMockup,
  }))
)
const SocialProof = lazy(() =>
  import("@/components/landing/SocialProof").then((mod) => ({
    default: mod.SocialProof,
  }))
)
const ProblemStatement = lazy(() =>
  import("@/components/landing/ProblemStatement").then((mod) => ({
    default: mod.ProblemStatement,
  }))
)
const SolutionSection = lazy(() =>
  import("@/components/landing/SolutionSection").then((mod) => ({
    default: mod.SolutionSection,
  }))
)

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
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
          scrolled ? "bg-background border-b border-border" : "bg-background"
        }`}
      >
        <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-foreground">
            w-ai.online
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="hover:opacity-70 transition-opacity"
            >
              تسجيل الدخول
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              className="bg-primary hover:opacity-90 transition-opacity"
            >
              ابدأ الآن
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-6 bg-background">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              أتمت محادثات واتساب للأعمال
              <br />
              <span className="text-primary">ووسّع عملك</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              منصة شاملة لإدارة واتساب للأعمال بالذكاء الاصطناعي. وفر الوقت وزد المبيعات.
            </p>
            <div className="pt-4">
              <Button
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="text-lg px-10 py-7 bg-primary hover:opacity-90 transition-opacity"
              >
                ابدأ مجاناً الآن
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <Suspense
        fallback={
          <section className="py-16 bg-muted/20">
            <div className="container mx-auto px-4 md:px-6">
              <div className="h-16 bg-muted/30 rounded animate-pulse"></div>
            </div>
          </section>
        }
      >
        <SocialProof />
      </Suspense>

      {/* Problem Statement Section */}
      <Suspense
        fallback={
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
              <div className="text-center mb-16">
                <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 bg-muted/30 rounded-lg animate-pulse"></div>
                ))}
              </div>
            </div>
          </section>
        }
      >
        <ProblemStatement />
      </Suspense>

      {/* Solution Section */}
      <Suspense
        fallback={
          <section className="py-24 bg-muted/20">
            <div className="container mx-auto px-4 md:px-6">
              <div className="text-center mb-16">
                <div className="h-8 bg-muted rounded w-48 mx-auto mb-4 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-80 mx-auto animate-pulse"></div>
              </div>
              <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-40 bg-muted/30 rounded-lg animate-pulse"></div>
                ))}
              </div>
              <div className="h-12 bg-muted/30 rounded w-48 mx-auto animate-pulse"></div>
            </div>
          </section>
        }
      >
        <SolutionSection />
      </Suspense>

      {/* Phone Mockup Section */}
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

      {/* Benefits & Features Section */}
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

      {/* CTA After Features */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="text-lg px-10 py-7 bg-primary hover:opacity-90 transition-opacity"
            >
              ابدأ استخدام المميزات الآن
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Live Stats Section */}
      <Suspense
        fallback={
          <section className="py-20 bg-muted/20">
            <div className="container mx-auto px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="border border-border rounded-2xl p-6 bg-background animate-pulse"
                  >
                    <div className="h-12 w-12 rounded-xl bg-muted mb-4"></div>
                    <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        }
      >
        <LiveStats />
      </Suspense>

      {/* World Map Section */}
      <Suspense
        fallback={
          <section className="py-32 bg-background">
            <div className="container mx-auto px-4 md:px-6">
              <div className="text-center mb-16">
                <div className="h-8 bg-muted rounded w-64 mx-auto mb-4 animate-pulse"></div>
                <div className="h-6 bg-muted rounded w-96 mx-auto animate-pulse"></div>
              </div>
              <div className="max-w-5xl mx-auto h-96 bg-muted/5 rounded-2xl animate-pulse"></div>
            </div>
          </section>
        }
      >
        <WorldMap />
      </Suspense>

      {/* Testimonials Section */}
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

          {/* CTA After Testimonials */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-12"
          >
            <Button
              size="lg"
              onClick={() => router.push("/dashboard")}
              className="text-lg px-10 py-7 bg-primary hover:opacity-90 transition-opacity"
            >
              انضم إلى عملائنا السعداء
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
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


      {/* FAQ Section */}
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

      {/* CTA Section */}
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
