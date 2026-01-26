"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import Image from "next/image"
import {
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Zap,
  ShoppingBag,
  Link2,
  Bot,
  Check,
  Globe,
  Smartphone,
  LayoutDashboard,
  Megaphone,
  Workflow
} from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { useUserContext } from "@/hooks/useUserContext"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedCounter } from "@/components/landing/AnimatedCounter"
import { cn } from "@/lib/utils"

// Lazy load components
const FeatureShowcase = lazy(() =>
  import("@/components/landing/FeatureShowcase").then((mod) => ({
    default: mod.FeatureShowcase,
  }))
)
const DashboardPreview = lazy(() =>
  import("@/components/landing/DashboardPreview").then((mod) => ({
    default: mod.DashboardPreview,
  }))
)
const AutomationShowcase = lazy(() =>
  import("@/components/landing/showcase/AutomationShowcase").then((mod) => ({
    default: mod.AutomationShowcase,
  }))
)
const CampaignsShowcase = lazy(() =>
  import("@/components/landing/showcase/CampaignsShowcase").then((mod) => ({
    default: mod.CampaignsShowcase,
  }))
)
const ChatShowcase = lazy(() =>
  import("@/components/landing/showcase/ChatShowcase").then((mod) => ({
    default: mod.ChatShowcase,
  }))
)

// Number formatting utility
function formatNumber(num: number): string {
  if (num >= 1000000) {
    const millions = num / 1000000
    return millions >= 10 ? `${Math.floor(millions)}M+` : `${millions.toFixed(1)}M+`
  }
  if (num >= 1000) {
    const thousands = num / 1000
    return thousands >= 10 ? `${Math.floor(thousands)}K+` : `${thousands.toFixed(1)}K+`
  }
  return num.toString()
}

// Animated number component
function AnimatedFormattedNumber({ value, duration = 2000, className = "" }: { value: number; duration?: number; className?: string }) {
  if (!value && value !== 0) return <span className={className}>--</span>

  let displayValue = value
  let suffix = ""
  let decimals = 0

  if (value >= 1000000) {
    const millions = value / 1000000
    displayValue = millions >= 10 ? Math.floor(millions) : parseFloat(millions.toFixed(1))
    decimals = millions >= 10 ? 0 : 1
    suffix = "M+"
  } else if (value >= 1000) {
    const thousands = value / 1000
    displayValue = thousands >= 10 ? Math.floor(thousands) : parseFloat(thousands.toFixed(1))
    decimals = thousands >= 10 ? 0 : 1
    suffix = "K+"
  }

  return (
    <AnimatedCounter
      value={displayValue}
      duration={duration}
      className={className}
      decimals={decimals}
      suffix={suffix}
    />
  )
}

export default function LandingPage() {
  const { isLoading, isAuthenticated } = useUserContext()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)

  const publicStats = useQuery(api.publicStats.getPublicStats)

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

  if (isLoading || isAuthenticated) return null

  const pricingPlans = [
    {
      name: "مجاني",
      price: 0,
      description: "للمتاجر الصغيرة والمبتدئين",
      features: ["1,000 رسالة/شهر", "بوت ذكي أساسي", "إدارة حملات بسيطة", "دعم فني عبر البريد"],
      highlight: false
    },
    {
      name: "الأكثر شعبية",
      price: 199,
      description: "للأعمال المتنامية",
      features: ["50,000 رسالة/شهر", "ذكاء اصطناعي متطور", "حملات غير محدودة", "ربط مع سلة وزد", "دعم فني مباشر"],
      highlight: true
    },
    {
      name: "مؤسسات",
      price: 999,
      description: "للشركات الكبرى",
      features: ["رسائل لا محدودة", "مدير حساب خاص", "API مخصص", "تخصيص كامل للنظام", "اتفاقية مستوى الخدمة"],
      highlight: false
    }
  ]

  const faqs = [
    { question: "هل أحتاج لبطاقة ائتمان للتجربة؟", answer: "لا، يمكنك البدء بالتجربة المجانية لمدة 14 يوم بدون أي التزامات." },
    { question: "هل يمكنني ربط رقمي الحالي؟", answer: "نعم، يمكنك تحويل رقمك الحالي إلى واتساب للأعمال API بسهولة عبر منصتنا." },
    { question: "ماذا يحدث بعد انتهاء التجربة؟", answer: "يمكنك اختيار الباقة المناسبة لك أو البقاء على الباقة المجانية المحدودة." },
    { question: "هل تدعمون الربط مع سلة؟", answer: "نعم، لدينا تكامل كامل ومباشر مع منصة سلة لمزامنة الطلبات والعملاء." }
  ]

  return (
    <div className="min-h-screen bg-background font-sans text-foreground overflow-x-hidden" dir="rtl">

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
            x: [0, 20, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] opacity-60"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -5, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[-10%] w-[800px] h-[800px] bg-secondary/40 rounded-full blur-[120px] opacity-50"
        />
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-bold mb-4"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            منصة متكاملة: حملات، محادثات، وأتمتة 🚀
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-[100px] font-black tracking-tight leading-[1.05] tracking-[-0.04em]"
          >
            جهاز تحكم <br className="hidden md:block" />
            <span className="text-secondary-foreground underline decoration-wavy decoration-primary/20 underline-offset-[12px]">تجارتك الذكية</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-muted-foreground/80 max-w-3xl mx-auto leading-relaxed font-medium"
          >
            نحن لا نقدم مجرد شات بوت. نحن نبني لك فريق مبيعات ذكي يعمل 24/7 داخل واتساب، يربط مخزونك، يدير حملاتك، ويضاعف أرباحك.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Button size="lg" onClick={() => router.push("/dashboard")} className="h-14 px-8 rounded-[16px] text-lg font-bold w-full sm:w-auto transition-all hover:-translate-y-1">
              ابدأ تجربتك المجانية
              <ArrowRight className="mr-2 h-5 w-5" />
            </Button>
          </motion.div>

          {/* Integration Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="pt-12 flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
          >
            <div className="text-xl font-black flex items-center gap-2"><ShoppingBag className="text-primary" /> Salla</div>
            <div className="text-xl font-black flex items-center gap-2"><Globe className="text-primary" /> Zid</div>
            <div className="text-xl font-black flex items-center gap-2"><MessageSquare className="text-primary" /> WhatsApp</div>
            <div className="text-xl font-black flex items-center gap-2"><Zap className="text-primary" /> Zapier</div>
            <div className="text-xl font-black flex items-center gap-2"><Bot className="text-primary" /> OpenAI</div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 bg-background relative overflow-hidden section-divider">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">نظرة شاملة من الداخل</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">أدوات احترافية مصممة لنمو تجارتك دون تعقيد</p>
          </div>

          <Tabs defaultValue="automation" className="w-full max-w-6xl mx-auto" dir="rtl">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-muted/40 rounded-[24px] mb-16 border border-border/10">
              <TabsTrigger value="automation" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary py-5 rounded-[20px] font-bold text-lg gap-3 transition-all hover:bg-white/40">
                <LayoutDashboard className="h-5 w-5" />
                الأتمتة
              </TabsTrigger>
              <TabsTrigger value="campaigns" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary py-5 rounded-[20px] font-bold text-lg gap-3 transition-all hover:bg-white/40">
                <Megaphone className="h-5 w-5" />
                الحملات
              </TabsTrigger>
              <TabsTrigger value="chat" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-primary py-5 rounded-[20px] font-bold text-lg gap-3 transition-all hover:bg-white/40">
                <MessageSquare className="h-5 w-5" />
                المحادثات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="automation" className="mt-0">
              <Suspense fallback={<div className="h-[500px] w-full bg-muted animate-pulse rounded-[24px]" />}>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black">ابنِ بوت ذكي في دقائق</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      محرر مرئي سهل السحب والإفلات. صمم تدفقات المحادثة، الردود التلقائية، وإسناد العملاء للموظفين دون كتابة سطر كود واحد.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> قوالب جاهزة للسلات المتروكة</li>
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> ردود تلقائية 24/7</li>
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> تكامل مباشر مع متجرك</li>
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-20 pointer-events-none" />
                    <AutomationShowcase />
                  </div>
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="campaigns" className="mt-0">
              <Suspense fallback={<div className="h-[500px] w-full bg-muted animate-pulse rounded-[24px]" />}>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="relative order-2 md:order-1">
                    <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full opacity-20 pointer-events-none" />
                    <CampaignsShowcase />
                  </div>
                  <div className="space-y-6 order-1 md:order-2">
                    <h3 className="text-3xl font-black">حملات تصل لآلاف العملاء</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      أطلق حملات واتساب تسويقية دقيقة الاستهداف. راقب معدلات الوصول والقراءة في الوقت الفعلي وحسن نتائجك باستمرار.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> تقسيم ذكي للجمهور</li>
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> تقارير أداء مفصلة</li>
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> جدولة الحملات مستقبلاً</li>
                    </ul>
                  </div>
                </div>
              </Suspense>
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <Suspense fallback={<div className="h-[500px] w-full bg-muted animate-pulse rounded-[24px]" />}>
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <h3 className="text-3xl font-black">صندوق وارد واحد للجميع</h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      لا تفقد أي رسالة. جميع محادثات واتساب في مكان واحد، مع إمكانية توزيع المحادثات على فريق العمل واستخدام الردود السريعة والذكاء الاصطناعي.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> دعم فني أسرع بـ 3 مرات</li>
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> أدوات تعاون فريقي</li>
                      <li className="flex items-center gap-3 font-medium"><Check className="text-primary h-5 w-5" /> مساعد ذكي يكتب الردود عنك</li>
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 blur-[100px] rounded-full opacity-20 pointer-events-none" />
                    <ChatShowcase />
                  </div>
                </div>
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Main Feature Highlight (Dashboard Preview) - "Command Center" vibe */}
      <section className="py-24 bg-muted/20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-right">
              <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm mb-2">لوحة التحكم المركزية</div>
              <h2 className="text-4xl md:text-5xl font-black leading-tight">
                إدارتك الكاملة <br />
                <span className="text-primary">في شاشة واحدة</span>
              </h2>
              <p className="text-xl text-muted-foreground">
                نظرة شاملة على مبيعاتك، رسائلك، وأداء فريقك. اتخذ قرارات مبنية على بيانات حقيقية وليس تخمينات.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-background p-4 rounded-[16px] border border-border/50 text-center">
                  <div className="text-3xl font-black text-foreground">100%</div>
                  <div className="text-sm text-muted-foreground mt-1">رؤية شاملة</div>
                </div>
                <div className="bg-background p-4 rounded-[16px] border border-border/50 text-center">
                  <div className="text-3xl font-black text-foreground">0</div>
                  <div className="text-sm text-muted-foreground mt-1">تعقيد تقني</div>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full flex justify-center">
              <Suspense fallback={<div className="w-full max-w-lg h-[400px] bg-muted rounded-[32px] animate-pulse" />}>
                <DashboardPreview />
              </Suspense>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards - Glassmorphism */}
      <section className="py-20 bg-background relative z-10">
        <div className="container mx-auto px-4">
          <div className="p-4 md:p-8 rounded-[32px] bg-primary text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 divide-x divide-x-reverse divide-white/20">
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black">
                  {publicStats ? <AnimatedFormattedNumber value={publicStats.totalMessages} /> : "--"}
                </div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">رسالة تم معالجتها</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black">
                  {publicStats ? <AnimatedFormattedNumber value={publicStats.activeOrganizations || 1500} /> : "--"}
                </div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">متجر يثق بنا</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black">50M+</div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">إشعار مُرسل</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-4xl md:text-5xl font-black">99.9%</div>
                <div className="text-sm font-bold opacity-80 uppercase tracking-wider">جاهزية النظام</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Pricing Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl font-black">خطط أسعار بسيطة وشفافة</h2>
            <p className="text-xl text-muted-foreground">ابدأ مجاناً، وادفع فقط عندما تنمو.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "relative p-8 rounded-[24px] border",
                  plan.highlight
                    ? "bg-white dark:bg-slate-900 border-primary scale-105 z-10"
                    : "bg-background border-border hover:border-primary/50 transition-colors"
                )}
              >
                {plan.highlight && (
                  <div className="absolute top-0 inset-x-0 -mt-4 text-center">
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">الأكثر اختياراً</span>
                  </div>
                )}
                <div className="text-center space-y-4 mb-8">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-black">{plan.price}</span>
                    <span className="text-muted-foreground font-medium">ريال / شهرياً</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-medium">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    "w-full h-12 rounded-[16px] font-bold",
                    plan.highlight ? "bg-primary hover:bg-primary/90" : "bg-muted text-foreground hover:bg-slate-200 dark:hover:bg-slate-800"
                  )}
                >
                  {plan.price === 0 ? "ابدأ مجاناً" : "اشترك الآن"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-black text-center mb-12">أسئلة شائعة</h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border rounded-[16px] px-6 data-[state=open]:bg-muted/30">
                <AccordionTrigger className="text-right font-bold py-6 hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-lg leading-relaxed pb-6 text-right">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  )
}
