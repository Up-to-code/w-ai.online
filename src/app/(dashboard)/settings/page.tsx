"use client"

import { useState, useEffect } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Building2,
  Settings as SettingsIcon,
  Save,
  Upload,
  Mail,
  Phone,
  Globe,
  Clock,
  Languages,
  Bell,
  Bot,
  Shield,
  ShoppingBag,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Link2,
  CreditCard,
  Crown,
  Lock,
  Volume2,
  VolumeX,
  ArrowUpRight,
} from "lucide-react"
import { toast } from "sonner"
import { initialsFromName } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"

// Permission constants (client-side copy)
const PERMISSIONS = {
  MANAGE_ORG: "manage_org",
  MANAGE_MEMBERS: "manage_members",
  MANAGE_INTEGRATIONS: "manage_integrations",
  MANAGE_CAMPAIGNS: "manage_campaigns",
  SEND_MESSAGES: "send_messages",
  VIEW_REPORTS: "view_reports",
  MANAGE_CONTACTS: "manage_contacts",
  MANAGE_TEMPLATES: "manage_templates",
  MANAGE_WORKFLOWS: "manage_workflows",
} as const

// Role to permissions mapping (client-side copy)
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    PERMISSIONS.MANAGE_ORG,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.MANAGE_WORKFLOWS,
  ],
  admin: [
    PERMISSIONS.MANAGE_INTEGRATIONS,
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CONTACTS,
    PERMISSIONS.MANAGE_TEMPLATES,
    PERMISSIONS.MANAGE_WORKFLOWS,
  ],
  agent: [
    PERMISSIONS.MANAGE_CAMPAIGNS,
    PERMISSIONS.SEND_MESSAGES,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_CONTACTS,
  ],
  viewer: [
    PERMISSIONS.VIEW_REPORTS,
  ],
}

function getPermissionsForRole(role: string | null): string[] {
  if (!role) return []
  return ROLE_PERMISSIONS[role] || []
}

const permissionLabels: Record<string, string> = {
  [PERMISSIONS.MANAGE_ORG]: "إدارة المنظمة",
  [PERMISSIONS.MANAGE_MEMBERS]: "إدارة الأعضاء",
  [PERMISSIONS.MANAGE_INTEGRATIONS]: "إدارة التكاملات",
  [PERMISSIONS.MANAGE_CAMPAIGNS]: "إدارة الحملات",
  [PERMISSIONS.SEND_MESSAGES]: "إرسال الرسائل",
  [PERMISSIONS.VIEW_REPORTS]: "عرض التقارير",
  [PERMISSIONS.MANAGE_CONTACTS]: "إدارة العملاء",
  [PERMISSIONS.MANAGE_TEMPLATES]: "إدارة القوالب",
  [PERMISSIONS.MANAGE_WORKFLOWS]: "إدارة الأتمتة",
}

const allPermissions = Object.values(PERMISSIONS)

export default function SettingsPage() {
  const { userId, user } = useUserContext()
  const { currentOrganization, organizations, userRole } = useOrganizationContext()
  const updateProfile = useUserMutation(api.users.updateProfile)
  const updateOrganization = useMutation(api.organizations.updateOrganization)
  const getMembers = useQuery(api.organizations.getMembers, currentOrganization?._id ? { organizationId: currentOrganization._id } : "skip")
  const updateMemberRole = useMutation(api.organizations.updateMemberRole)
  const removeMember = useMutation(api.organizations.removeMember)
  
  // Settings queries
  const userSettings = useQuery(
    api.settings.getUserSettings,
    userId ? { userId, organizationId: currentOrganization?._id } : "skip"
  )
  const updateUserSettings = useMutation(api.settings.updateUserSettings)
  
  // Connection status queries
  const organizationId = currentOrganization?._id
  const sallaConnection = useQuery(
    api.salla.getConnection,
    organizationId ? { organizationId } : userId ? { userId } : "skip"
  )
  const metaConnection = useQuery(
    api.meta.getConnection,
    organizationId ? { organizationId } : userId ? { userId } : "skip"
  )
  
  const isSallaConnected = !!sallaConnection
  const isMetaConnected = metaConnection?.connected || false

  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)

  // Profile state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Organization state
  const [orgName, setOrgName] = useState("")
  const [orgEmail, setOrgEmail] = useState("")
  const [orgPhone, setOrgPhone] = useState("")
  const [orgWebsite, setOrgWebsite] = useState("")
  const [orgTimezone, setOrgTimezone] = useState("")
  const [orgLanguage, setOrgLanguage] = useState("")

  // General Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [globalNotificationsEnabled, setGlobalNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [aiAutoResponseEnabled, setAiAutoResponseEnabled] = useState(false)

  // Load user data
  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setPhone(user.phone || "")
      if (user.avatarUrl) {
        setAvatarPreview(user.avatarUrl)
      }
    }
  }, [user])

  // Load organization data
  useEffect(() => {
    if (currentOrganization) {
      setOrgName(currentOrganization.name || "")
      setOrgEmail(currentOrganization.email || "")
      setOrgPhone(currentOrganization.phone || "")
      setOrgWebsite(currentOrganization.website || "")
      setOrgTimezone(currentOrganization.timezone || "")
      setOrgLanguage(currentOrganization.language || "")
    }
  }, [currentOrganization])

  // Load user settings
  useEffect(() => {
    if (userSettings) {
      setNotificationsEnabled(userSettings.notificationsEnabled)
      setGlobalNotificationsEnabled(userSettings.globalNotificationsEnabled)
      setSoundEnabled(userSettings.soundEnabled)
      setEmailEnabled(userSettings.emailEnabled)
      setAiAutoResponseEnabled(userSettings.aiAutoResponseEnabled)
    }
  }, [userSettings])

  const handleSaveProfile = async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      await updateProfile({
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      toast.success("تم حفظ الملف الشخصي بنجاح")
    } catch (error: any) {
      toast.error(error?.message || "فشل حفظ الملف الشخصي")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveOrganization = async () => {
    if (!userId || !currentOrganization?._id) return
    if (userRole !== "owner") {
      toast.error("فقط مالك المنظمة يمكنه تعديل هذه الإعدادات")
      return
    }
    setIsSaving(true)
    try {
      await updateOrganization({
        userId,
        organizationId: currentOrganization._id,
        name: orgName.trim() || undefined,
        email: orgEmail.trim() || undefined,
        phone: orgPhone.trim() || undefined,
        website: orgWebsite.trim() || undefined,
        timezone: orgTimezone || undefined,
        language: orgLanguage || undefined,
      })
      toast.success("تم حفظ إعدادات المنظمة بنجاح")
    } catch (error: any) {
      toast.error(error?.message || "فشل حفظ إعدادات المنظمة")
    } finally {
      setIsSaving(false)
    }
  }

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
        aiAutoResponseEnabled,
      })
      toast.success("تم حفظ الإعدادات العامة بنجاح")
    } catch (error: any) {
      toast.error(error?.message || "فشل حفظ الإعدادات")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار صورة")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت")
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      owner: { label: "مالك", variant: "default" },
      admin: { label: "مدير", variant: "default" },
      agent: { label: "وكيل", variant: "secondary" },
      viewer: { label: "مشاهد", variant: "outline" },
    }
    const config = roleLabels[role] || { label: role, variant: "outline" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const canManageOrg = userRole === "owner"
  const isOwner = userRole === "owner"
  const currentPlan = userSettings?.currentPlan || "free"
  const planLabels: Record<string, string> = {
    free: "مجاني",
    startup: "بدء التشغيل",
    professional: "احترافي",
    enterprise: "مؤسسي",
  }

  // Get permissions for each role
  const ownerPermissions = getPermissionsForRole("owner")
  const adminPermissions = getPermissionsForRole("admin")
  const agentPermissions = getPermissionsForRole("agent")
  const viewerPermissions = getPermissionsForRole("viewer")

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة إعدادات الحساب والمنظمة</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 gap-1">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" />
            الإعدادات العامة
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            الملف الشخصي
          </TabsTrigger>
          {currentOrganization && (
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              المنظمة
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="permissions" className="gap-2">
              <Shield className="h-4 w-4" />
              الصلاحيات
            </TabsTrigger>
          )}
          <TabsTrigger value="integrations" className="gap-2">
            <Link2 className="h-4 w-4" />
            التكاملات
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            الدفع
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6 mt-6">
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

          {/* AI Auto Response Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                الرد التلقائي بالذكاء الاصطناعي
              </CardTitle>
              <CardDescription>
                تفعيل الرد التلقائي على الرسائل الواردة باستخدام الذكاء الاصطناعي
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-auto-response">تفعيل الرد التلقائي</Label>
                  <p className="text-sm text-muted-foreground">
                    السماح للنظام بالرد تلقائياً على الرسائل الواردة
                  </p>
                </div>
                <Switch
                  id="ai-auto-response"
                  checked={aiAutoResponseEnabled}
                  onCheckedChange={setAiAutoResponseEnabled}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">الخطة الحالية</span>
                  <Badge variant={currentPlan === "free" || currentPlan === "startup" ? "outline" : "default"}>
                    {planLabels[currentPlan]}
                  </Badge>
                </div>
                {(currentPlan === "free" || currentPlan === "startup") && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <p>الرد التلقائي معطل افتراضياً في هذه الخطة</p>
                    <Link href="/settings/payment">
                      <Button variant="link" size="sm" className="gap-1 h-auto p-0">
                        ترقية الخطة
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                )}
                {(currentPlan === "professional" || currentPlan === "enterprise") && (
                  <p className="text-sm text-muted-foreground">
                    الرد التلقائي مفعل افتراضياً في هذه الخطة
                  </p>
                )}
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

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>الملف الشخصي</CardTitle>
              <CardDescription>معلومات الحساب الشخصية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt={name} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {initialsFromName(name || "المستخدم")}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        تغيير الصورة
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG أو GIF. الحد الأقصى 5 ميجابايت
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أدخل اسمك"
                />
              </div>

              {/* Email (read-only if from WorkOS) */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  البريد الإلكتروني مُدار من خلال WorkOS
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="966501234567"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={isSaving} className="gap-2">
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

        {/* Organization Tab */}
        {currentOrganization && (
          <TabsContent value="organization" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      إعدادات المنظمة
                      {!canManageOrg && (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </CardTitle>
                    <CardDescription>معلومات وإعدادات المنظمة</CardDescription>
                  </div>
                  {getRoleBadge(userRole || "")}
                </div>
                {!canManageOrg && (
                  <div className="mt-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    فقط مالك المنظمة يمكنه تعديل هذه الإعدادات
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization Name */}
                <div className="space-y-2">
                  <Label htmlFor="org-name">اسم المنظمة</Label>
                  <Input
                    id="org-name"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="أدخل اسم المنظمة"
                    disabled={!canManageOrg}
                  />
                </div>

                {/* Organization Email */}
                <div className="space-y-2">
                  <Label htmlFor="org-email">البريد الإلكتروني</Label>
                  <Input
                    id="org-email"
                    type="email"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                    placeholder="org@example.com"
                    disabled={!canManageOrg}
                  />
                </div>

                {/* Organization Phone */}
                <div className="space-y-2">
                  <Label htmlFor="org-phone">رقم الهاتف</Label>
                  <Input
                    id="org-phone"
                    type="tel"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                    placeholder="966501234567"
                    disabled={!canManageOrg}
                  />
                </div>

                {/* Organization Website */}
                <div className="space-y-2">
                  <Label htmlFor="org-website">الموقع الإلكتروني</Label>
                  <Input
                    id="org-website"
                    type="url"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://example.com"
                    disabled={!canManageOrg}
                  />
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label htmlFor="org-timezone">المنطقة الزمنية</Label>
                  <Input
                    id="org-timezone"
                    value={orgTimezone}
                    onChange={(e) => setOrgTimezone(e.target.value)}
                    placeholder="Asia/Riyadh"
                    disabled={!canManageOrg}
                  />
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="org-language">اللغة</Label>
                  <Input
                    id="org-language"
                    value={orgLanguage}
                    onChange={(e) => setOrgLanguage(e.target.value)}
                    placeholder="ar"
                    disabled={!canManageOrg}
                  />
                </div>

                {canManageOrg && (
                  <Button onClick={handleSaveOrganization} disabled={isSaving} className="gap-2">
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
                )}
              </CardContent>
            </Card>

            {/* Members Management (Owner only) */}
            {isOwner && getMembers && (
              <Card>
                <CardHeader>
                  <CardTitle>أعضاء المنظمة</CardTitle>
                  <CardDescription>إدارة أعضاء المنظمة وأدوارهم</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getMembers.map((member: any) => (
                        <TableRow key={member._id}>
                          <TableCell>{member.name || "بدون اسم"}</TableCell>
                          <TableCell>{member.email || "بدون بريد"}</TableCell>
                          <TableCell>{getRoleBadge(member.role)}</TableCell>
                          <TableCell>
                            {member.role !== "owner" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    const newRole = prompt("اختر الدور (admin, agent, viewer):")
                                    if (newRole && ["admin", "agent", "viewer"].includes(newRole)) {
                                      try {
                                        await updateMemberRole({
                                          userId: userId!,
                                          organizationId: currentOrganization._id,
                                          memberUserId: member._id,
                                          role: newRole as any,
                                        })
                                        toast.success("تم تحديث الدور")
                                      } catch (error: any) {
                                        toast.error(error?.message || "فشل تحديث الدور")
                                      }
                                    }
                                  }}
                                >
                                  تعديل
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={async () => {
                                    if (confirm("هل أنت متأكد من إزالة هذا العضو؟")) {
                                      try {
                                        await removeMember({
                                          userId: userId!,
                                          organizationId: currentOrganization._id,
                                          memberUserId: member._id,
                                        })
                                        toast.success("تم إزالة العضو")
                                      } catch (error: any) {
                                        toast.error(error?.message || "فشل إزالة العضو")
                                      }
                                    }
                                  }}
                                >
                                  إزالة
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Permissions Tab - Owner Only */}
        {isOwner && (
          <TabsContent value="permissions" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  مصفوفة الصلاحيات
                </CardTitle>
                <CardDescription>
                  نظرة عامة على الصلاحيات المتاحة لكل دور في المنظمة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الصلاحية</TableHead>
                        <TableHead className="text-center">مالك</TableHead>
                        <TableHead className="text-center">مدير</TableHead>
                        <TableHead className="text-center">وكيل</TableHead>
                        <TableHead className="text-center">مشاهد</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allPermissions.map((permission) => (
                        <TableRow key={permission}>
                          <TableCell className="font-medium">
                            {permissionLabels[permission] || permission}
                          </TableCell>
                          <TableCell className="text-center">
                            {ownerPermissions.includes(permission) ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {adminPermissions.includes(permission) ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {agentPermissions.includes(permission) ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {viewerPermissions.includes(permission) ? (
                              <CheckCircle2 className="h-5 w-5 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>ملاحظة:</strong> الصلاحيات محددة في النظام ولا يمكن تعديلها من خلال الواجهة.
                    للتحكم في الوصول، قم بتغيير أدوار المستخدمين في قسم "المنظمة".
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salla Connection Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#004D3D] flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">سلة</CardTitle>
                      <CardDescription>Salla E-commerce Platform</CardDescription>
                    </div>
                  </div>
                  {isSallaConnected ? (
                    <Badge className="bg-success text-success-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" /> متصل
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3" /> غير متصل
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isSallaConnected && sallaConnection ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">اسم المتجر</span>
                      <span className="font-medium">{sallaConnection.storeName || "غير محدد"}</span>
                    </div>
                    {sallaConnection.storeUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">رابط المتجر</span>
                        <a href={sallaConnection.storeUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {sallaConnection.storeUrl}
                        </a>
                      </div>
                    )}
                    {sallaConnection.connectedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">تاريخ الاتصال</span>
                        <span>{new Date(sallaConnection.connectedAt).toLocaleDateString('ar-SA')}</span>
                      </div>
                    )}
                    {sallaConnection.isExpired && (
                      <div className="p-2 bg-warning/10 text-warning rounded-lg text-xs">
                        انتهت صلاحية الاتصال. يرجى إعادة الاتصال.
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    اربط حساب سلة لمزامنة المنتجات والطلبات.
                  </p>
                )}
                <Button
                  variant={isSallaConnected ? "outline" : "default"}
                  className="w-full"
                  onClick={() => window.location.href = "/integrations"}
                >
                  {isSallaConnected ? "إدارة الاتصال" : "ربط سلة"}
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp/Meta Connection Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#128C7E] flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">WhatsApp</CardTitle>
                      <CardDescription>Meta Business API</CardDescription>
                    </div>
                  </div>
                  {isMetaConnected ? (
                    <Badge className="bg-success text-success-foreground gap-1">
                      <CheckCircle2 className="h-3 w-3" /> متصل
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <XCircle className="h-3 w-3" /> غير متصل
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isMetaConnected && metaConnection ? (
                  <div className="space-y-2 text-sm">
                    {metaConnection.phoneNumberId && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Phone Number ID</span>
                        <span className="font-mono text-xs">{metaConnection.phoneNumberId}</span>
                      </div>
                    )}
                    {metaConnection.wabaId && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">WABA ID</span>
                        <span className="font-mono text-xs">{metaConnection.wabaId}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    اربط حساب Meta Business لإرسال واستقبال الرسائل عبر WhatsApp.
                  </p>
                )}
                <Button
                  variant={isMetaConnected ? "outline" : "default"}
                  className="w-full"
                  onClick={() => window.location.href = "/integrations"}
                >
                  {isMetaConnected ? "إدارة الاتصال" : "ربط WhatsApp"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                الاشتراك والدفع
              </CardTitle>
              <CardDescription>إدارة خطتك وطرق الدفع</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">الخطة الحالية</span>
                  <Badge variant={currentPlan === "free" || currentPlan === "startup" ? "outline" : "default"}>
                    {planLabels[currentPlan]}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">حالة الاشتراك</span>
                  <Badge variant="default">نشط</Badge>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  صفحة إدارة الدفع قيد التطوير. سيتم إضافة إدارة طرق الدفع وتاريخ الفواتير قريباً.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  عرض الفواتير
                </Button>
                <Button variant="outline" className="flex-1">
                  تغيير الخطة
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
