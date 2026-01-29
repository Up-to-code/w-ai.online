"use client"

import { useState, useEffect } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Settings as SettingsIcon,
  Save,
  Bell,
  CreditCard,
  ArrowUpRight,
  Mail,
  Volume2,
  VolumeX,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

// Permission constants (removed)

export default function SettingsPage() {
  const { userId, user } = useUserContext()
  const { currentOrganization, userRole } = useOrganizationContext()

  // Settings queries
  const userSettings = useQuery(
    api.settings.getUserSettings,
    userId ? { userId, organizationId: currentOrganization?._id } : "skip"
  )
  const updateUserSettings = useMutation(api.settings.updateUserSettings)

  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  // General Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)

  // Load user settings
  useEffect(() => {
    if (userSettings) {
      setNotificationsEnabled(userSettings.notificationsEnabled)
      setGlobalNotificationsEnabled(userSettings.globalNotificationsEnabled)
      setSoundEnabled(userSettings.soundEnabled)
      setEmailEnabled(userSettings.emailEnabled)
    }
  }, [userSettings])

  const handleSaveGeneralSettings = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      await updateUserSettings({
        userId,
        organizationId: currentOrganization?._id,
        notificationsEnabled,
        globalNotificationsEnabled,
        soundEnabled,
        emailEnabled,
      })
      toast.success("تم حفظ الإعدادات العامة بنجاح")
    } catch (error: any) {
      toast.error(error?.message || "فشل حفظ الإعدادات")
    } finally {
      setIsSaving(false)
    }
  }

  const currentPlan = userSettings?.currentPlan || "free"
  const planLabels: Record<string, string> = {
    free: "مجاني",
    startup: "بدء التشغيل",
    professional: "احترافي",
    enterprise: "مؤسسي",
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground mt-2">إدارة حسابك، فريقك، وتكاملات النظام</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row-reverse gap-8 items-start">
        {/* Vertical Sidebar Navigation */}
        <aside className="w-full md:w-72 shrink-0 bg-card border rounded-2xl p-2 shadow-sm">
          <TabsList className="flex flex-col h-auto w-full bg-transparent gap-1 p-0">
            <SettingsTabTrigger value="general" icon={SettingsIcon} label="الإعدادات العامة" isActive={activeTab === "general"} />

            <SettingsTabTrigger value="billing" icon={CreditCard} label="الاشتراك والفواتير" isActive={activeTab === "billing"} />
          </TabsList>
        </aside>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 mt-0">
            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  الإشعارات
                </CardTitle>
                <CardDescription>إدارة تفضيلات الإشعارات والإخطارات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications-enabled">تفعيل الإشعارات</Label>
                    <p className="text-sm text-muted-foreground">استقبل الإشعارات في النظام</p>
                  </div>
                  <Switch
                    id="notifications-enabled"
                    checked={notificationsEnabled}
                    onCheckedChange={setNotificationsEnabled}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="global-notifications">الإشعارات العامة في لوحة التحكم</Label>
                    <p className="text-sm text-muted-foreground">عرض الإشعارات في لوحة التحكم</p>
                  </div>
                  <Switch
                    id="global-notifications"
                    checked={globalNotificationsEnabled}
                    onCheckedChange={setGlobalNotificationsEnabled}
                    disabled={!notificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex items-center gap-2">
                    {soundEnabled ? (
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="sound-enabled">صوت الإشعارات</Label>
                      <p className="text-sm text-muted-foreground">تشغيل صوت عند استقبال إشعار</p>
                    </div>
                  </div>
                  <Switch
                    id="sound-enabled"
                    checked={soundEnabled}
                    onCheckedChange={setSoundEnabled}
                    disabled={!notificationsEnabled}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="email-enabled">الإشعارات عبر البريد</Label>
                      <p className="text-sm text-muted-foreground">إرسال إشعارات عبر البريد الإلكتروني</p>
                    </div>
                  </div>
                  <Switch
                    id="email-enabled"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                    disabled={!notificationsEnabled}
                  />
                </div>

                <Button onClick={handleSaveGeneralSettings} disabled={isSaving} className="gap-2">
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>


          </TabsContent>





          {/* Billing & Subscription Tab */}
          <TabsContent value="billing" className="space-y-6 mt-6">
            {/* Current Plan Card */}
            <Card className="overflow-hidden border-primary/10 shadow-sm">
              <div className="bg-primary/5 p-6 border-b border-primary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      الخطة الحالية
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      أنت مشترك حالياً في خطة <span className="font-medium text-foreground">{planLabels[currentPlan]}</span>
                    </p>
                  </div>
                  <Badge variant={currentPlan === "free" ? "secondary" : "default"} className="text-sm px-3 py-1 w-fit">
                    {currentPlan === "free" ? "نشط - مجاني" : "نشط - مدفوع"}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">سعر الخطة</span>
                    <p className="text-2xl font-bold">
                      {currentPlan === "free" ? "0 ر.س" : currentPlan === "startup" ? "99 ر.س" : "199 ر.س"}
                      <span className="text-sm font-normal text-muted-foreground"> / شهرياً</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">تاريخ التجديد</span>
                    <p className="font-medium flex items-center gap-2">
                      12 فبراير 2024
                      <span className="text-xs text-muted-foreground">(يتم التجديد تلقائياً)</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">طريقة الدفع</span>
                    <p className="font-medium flex items-center gap-2">
                      Visa ending in 4242
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex gap-3">
                  <Button variant="default" className="gap-2">
                    <ArrowUpRight className="h-4 w-4" />
                    ترقية الخطة
                  </Button>
                  <Button variant="outline">إدارة طرق الدفع</Button>
                </div>
              </CardContent>
            </Card>

            {/* Invoices History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">سجل الفواتير</CardTitle>
                <CardDescription>عرض وتحميل الفواتير السابقة</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border">
                  <div className="grid grid-cols-4 p-4 bg-muted/30 text-xs font-medium text-muted-foreground border-b">
                    <div>رقم الفاتورة</div>
                    <div>التاريخ</div>
                    <div>المبلغ</div>
                    <div className="text-left">الحالة</div>
                  </div>
                  {[1, 2, 3].map((invoice) => (
                    <div key={invoice} className="grid grid-cols-4 p-4 border-b last:border-0 text-sm hover:bg-muted/20 transition-colors cursor-pointer items-center">
                      <div className="font-mono text-xs">INV-2024-00{invoice}</div>
                      <div>12 يناير, 2024</div>
                      <div>99.00 ر.س</div>
                      <div className="flex justify-end">
                        <Badge variant="outline" className="bg-success/5 text-success border-success/20">مدفوع</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function SettingsTabTrigger({ value, icon: Icon, label, isActive }: { value: string, icon: any, label: string, isActive: boolean }) {
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "flex items-center justify-start gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border-2 border-transparent",
        isActive
          ? "bg-primary/5 text-primary border-primary/10 shadow-[0_0_20px_-10px_rgba(var(--primary),0.3)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      <span>{label}</span>
    </TabsTrigger>
  )
}
