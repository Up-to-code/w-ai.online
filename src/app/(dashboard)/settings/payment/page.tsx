"use client"

import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Receipt,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ar } from "date-fns/locale"

export default function PaymentPage() {
  const { userId } = useUserContext()
  const { currentOrganization } = useOrganizationContext()
  
  const orgSettings = useQuery(
    api.settings.getOrganizationSettings,
    currentOrganization?._id ? { organizationId: currentOrganization._id } : "skip"
  )

  const planLabels: Record<string, { label: string; price: string; features: string[] }> = {
    free: {
      label: "مجاني",
      price: "0",
      features: [
        "حتى 1,000 رسالة/شهر",
        "وكيل ذكاء اصطناعي أساسي",
        "إدارة الحملات",
        "دعم عبر البريد",
      ],
    },
    startup: {
      label: "بدء التشغيل",
      price: "69",
      features: [
        "حتى 5,000 رسالة/شهر",
        "وكيل ذكاء اصطناعي متقدم",
        "حملات غير محدودة",
        "دعم أولوية",
      ],
    },
    professional: {
      label: "احترافي",
      price: "199",
      features: [
        "حتى 50,000 رسالة/شهر",
        "وكيل ذكاء اصطناعي متقدم",
        "حملات غير محدودة",
        "دعم أولوية",
        "أتمتة مخصصة",
      ],
    },
    enterprise: {
      label: "مؤسسي",
      price: "499",
      features: [
        "رسائل غير محدودة",
        "وكيل ذكاء اصطناعي متميز",
        "مدير حساب مخصص",
        "دعم 24/7",
        "تكاملات مخصصة",
        "تحليلات متقدمة",
      ],
    },
  }

  const currentPlan = orgSettings?.subscriptionPlan || "free"
  const currentPlanInfo = planLabels[currentPlan]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">الاشتراك والدفع</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة خطتك وطرق الدفع</p>
        </div>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            خطتك الحالية
          </CardTitle>
          <CardDescription>تفاصيل الاشتراك الحالي</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg font-semibold">{currentPlanInfo.label}</span>
                <Badge variant={currentPlan === "free" || currentPlan === "startup" ? "outline" : "default"}>
                  {orgSettings?.subscriptionStatus || "active"}
                </Badge>
              </div>
              <div className="text-2xl font-bold">
                {currentPlanInfo.price} <span className="text-sm font-normal text-muted-foreground">ريال/شهر</span>
              </div>
            </div>
            <div className="text-right">
              {orgSettings?.subscriptionExpiresAt && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">ينتهي في</p>
                  <p className="text-sm font-medium">
                    {format(new Date(orgSettings.subscriptionExpiresAt), "PPP", { locale: ar })}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">المميزات المتاحة:</h3>
            <ul className="space-y-2">
              {currentPlanInfo.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Receipt className="h-4 w-4 ml-2" />
              عرض الفواتير
            </Button>
            <Button className="flex-1">
              <ArrowUpRight className="h-4 w-4 ml-2" />
              تغيير الخطة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>الخطط المتاحة</CardTitle>
          <CardDescription>اختر الخطة التي تناسب احتياجاتك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(planLabels).map(([planKey, planInfo]) => (
              <Card
                key={planKey}
                className={planKey === currentPlan ? "border-primary border-2" : ""}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{planInfo.label}</CardTitle>
                  <div className="text-2xl font-bold">
                    {planInfo.price} <span className="text-sm font-normal text-muted-foreground">ريال</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {planInfo.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={planKey === currentPlan ? "outline" : "default"}
                    className="w-full"
                    disabled={planKey === currentPlan}
                  >
                    {planKey === currentPlan ? "الخطة الحالية" : "اختر الخطة"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>طرق الدفع</CardTitle>
          <CardDescription>إدارة طرق الدفع المحفوظة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              إدارة طرق الدفع قيد التطوير. سيتم إضافة إمكانية إدارة البطاقات الائتمانية قريباً.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            تاريخ الفواتير
          </CardTitle>
          <CardDescription>سجل المدفوعات والفواتير السابقة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              لا توجد فواتير حتى الآن. سيتم عرض تاريخ الفواتير هنا عند توفر البيانات.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
