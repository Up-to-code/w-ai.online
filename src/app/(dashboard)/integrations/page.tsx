"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { logger } from "@/lib/logger"
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { useAction, useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import {
    Link2,
    Check,
    MessageSquare,
    RefreshCw,
    Package,
    AlertCircle,
    ShoppingBag,
    Settings,
    CheckCircle2,
    XCircle,
    Calendar,
    Bot,
    Megaphone,
    ExternalLink,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// All available tools and integrations
const ALL_APPS = [
    {
        id: "bookings",
        type: "tool",
        name: "الحجوزات",
        description: "إدارة المواعيد والحجوزات مع عملائك. جدولة الاجتماعات وتتبع المواعيد.",
        icon: Calendar,
        color: "#8B5CF6",
        href: "/bookings",
    },
    {
        id: "products",
        type: "tool",
        name: "المنتجات",
        description: "إدارة المخزون والمنتجات والخدمات.",
        icon: Package,
        color: "#F59E0B",
        href: "/products",
    },
    {
        id: "salla",
        type: "integration",
        name: "سلة",
        description: "ربط متجرك على سلة لمزامنة المنتجات والطلبات والعملاء.",
        icon: ShoppingBag,
        color: "#004D3D",
        href: null,
    },
    {
        id: "whatsapp",
        type: "integration",
        name: "واتساب",
        description: "ربط WhatsApp Business API لإرسال واستقبال الرسائل.",
        icon: MessageSquare,
        color: "#128C7E",
        href: "/integrations/webhook",
    },
]

export default function IntegrationsPage() {
    const searchParams = useSearchParams()
    const success = searchParams.get("success")
    const error = searchParams.get("error")

    const { userId } = useUserContext()
    const { currentOrganization } = useOrganizationContext()
    const organizationId = currentOrganization?._id

    const sallaConnection = useQuery(
        api.salla.getConnection,
        organizationId ? { organizationId } : userId ? { userId } : "skip"
    )
    const metaConnection = useQuery(
        api.meta.getConnection,
        organizationId ? { organizationId } : userId ? { userId } : "skip"
    )

    const orgTools = useQuery(api.organizationTools.list, userId ? { userId } : "skip")
    const canManage = useQuery(api.organizationTools.canManageTools, userId ? { userId } : "skip")

    const disconnectSalla = useUserMutation(api.salla.disconnect)
    const disconnectMeta = useAction(api.meta.disconnect)
    const toggleTool = useMutation(api.organizationTools.toggle)
    const toggleAi = useMutation(api.organizationTools.toggleAi)

    const [isConnecting, setIsConnecting] = useState(false)
    const [showNotification, setShowNotification] = useState(!!success || !!error)

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => setShowNotification(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [showNotification])

    const handleSallaConnect = () => {
        setIsConnecting(true)
        const clientId = process.env.NEXT_PUBLIC_SALLA_CLIENT_ID
        const redirectUri = process.env.NEXT_PUBLIC_SALLA_REDIRECT_URI

        if (!clientId || !redirectUri) {
            logger.error("Missing Salla OAuth configuration")
            setIsConnecting(false)
            return
        }

        const authUrl = new URL("https://accounts.salla.sa/oauth2/auth")
        authUrl.searchParams.set("client_id", clientId)
        authUrl.searchParams.set("redirect_uri", redirectUri)
        authUrl.searchParams.set("response_type", "code")
        authUrl.searchParams.set("scope", "offline_access")
        authUrl.searchParams.set("state", crypto.randomUUID())
        window.location.href = authUrl.toString()
    }

    const handleDisconnectSalla = async () => {
        if (!userId) return
        try {
            await disconnectSalla({ userId, ...(organizationId && { organizationId }) })
            window.location.reload()
        } catch (err: any) {
            logger.error("Disconnect Salla error:", err)
        }
    }

    const handleDisconnectMeta = async () => {
        if (!userId) return
        try {
            await disconnectMeta({ userId, ...(organizationId && { organizationId }) })
            window.location.reload()
        } catch (err: any) {
            logger.error("Disconnect error:", err)
        }
    }

    const getAppStatus = (appId: string) => {
        if (appId === "salla") return !!sallaConnection
        if (appId === "whatsapp") return metaConnection?.connected || false
        return orgTools?.find((t: any) => t.toolId === appId)?.isActive ?? false
    }

    const getAiStatus = (appId: string) => {
        return orgTools?.find((t: any) => t.toolId === appId)?.aiEnabled ?? false
    }

    const handleToggle = async (appId: string, checked: boolean) => {
        if (!userId) return

        // Handle integrations separately
        if (appId === "salla") {
            if (checked) handleSallaConnect()
            else handleDisconnectSalla()
            return
        }
        if (appId === "whatsapp") {
            if (!checked) handleDisconnectMeta()
            return
        }

        // Handle tools
        try {
            await toggleTool({ userId, toolId: appId, isActive: checked })
            toast.success(checked ? "تم تفعيل الأداة" : "تم تعطيل الأداة")
        } catch (err: any) {
            toast.error(err.message || "حدث خطأ")
        }
    }

    const handleAiToggle = async (appId: string) => {
        if (!userId) return
        const currentAi = getAiStatus(appId)
        try {
            await toggleAi({ userId, toolId: appId, aiEnabled: !currentAi })
            toast.success(!currentAi ? "تم تفعيل AI" : "تم تعطيل AI")
        } catch (err: any) {
            toast.error(err.message || "حدث خطأ")
        }
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Notification */}
            {showNotification && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {success ? (
                        <>
                            <CheckCircle2 className="h-5 w-5" />
                            <span>تم الربط بنجاح!</span>
                        </>
                    ) : (
                        <>
                            <XCircle className="h-5 w-5" />
                            <span>فشل الربط: {error}</span>
                        </>
                    )}
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">التطبيقات والتكاملات</h1>
                <p className="text-muted-foreground text-sm mt-1">تفعيل وإدارة الأدوات والخدمات الخارجية</p>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_APPS.map((app) => {
                    const isActive = getAppStatus(app.id)
                    const isAiEnabled = getAiStatus(app.id)
                    const Icon = app.icon

                    return (
                        <Card key={app.id} className={cn(
                            "relative overflow-hidden transition-all",
                            isActive && "ring-1 ring-primary/30"
                        )}>
                            {/* Color bar */}
                            <div className="h-1.5" style={{ backgroundColor: app.color }} />

                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: app.color }}
                                        >
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{app.name}</CardTitle>
                                            <Badge
                                                variant={isActive ? "default" : "outline"}
                                                className={cn(
                                                    "text-[10px] mt-1",
                                                    isActive && "bg-success text-success-foreground"
                                                )}
                                            >
                                                {isActive ? "مفعل" : "غير مفعل"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={isActive}
                                        onCheckedChange={(checked) => handleToggle(app.id, checked)}
                                        disabled={!canManage || (app.id === "whatsapp" && !isActive)}
                                    />
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {app.description}
                                </p>

                                {isActive && (
                                    <div className="flex items-center gap-2">
                                        {/* AI Toggle for tools only */}
                                        {app.type === "tool" && canManage && (
                                            <Button
                                                variant={isAiEnabled ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => handleAiToggle(app.id)}
                                                className={cn("gap-1.5", isAiEnabled && "bg-primary")}
                                            >
                                                <Bot className="h-3.5 w-3.5" />
                                                AI
                                            </Button>
                                        )}

                                        {/* Open/Configure button */}
                                        {app.href && (
                                            <Link href={app.href} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full gap-2">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    فتح
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {!canManage && (
                <p className="text-sm text-muted-foreground text-center">
                    يمكن للمالك أو المسؤول فقط تعديل هذه الإعدادات
                </p>
            )}
        </div>
    )
}
