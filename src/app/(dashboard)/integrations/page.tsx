"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { logger } from "@/lib/logger"
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { useAction, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import {
    Link2,
    Check,
    ExternalLink,
    MessageSquare,
    RefreshCw,
    Package,
    AlertCircle,
    ShoppingBag,
    Settings,
    CheckCircle2,
    XCircle,
} from "lucide-react"
import { toast } from "sonner"

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
    const disconnectSalla = useUserMutation(api.salla.disconnect)
    const disconnectMeta = useAction(api.meta.disconnect)

    const [isConnecting, setIsConnecting] = useState(false)
    const [showNotification, setShowNotification] = useState(!!success || !!error)

    useEffect(() => {
        if (showNotification) {
            const timer = setTimeout(() => setShowNotification(false), 5000)
            return () => clearTimeout(timer)
        }
    }, [showNotification])

    const handleConnect = () => {
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
            setIsConnecting(true)
            await disconnectSalla({
                userId,
                ...(organizationId && { organizationId })
            })
            window.location.reload()
        } catch (err: any) {
            logger.error("Disconnect Salla error:", err)
            setIsConnecting(false)
        }
    }

    const handleDisconnectMeta = async () => {
        if (!userId) return
        try {
            setIsConnecting(true)
            await disconnectMeta({
                userId,
                ...(organizationId && { organizationId })
            })
            window.location.reload()
        } catch (err: any) {
            logger.error("Disconnect error:", err)
            setIsConnecting(false)
        }
    }

    const isSallaConnected = !!sallaConnection
    const isMetaConnected = metaConnection?.connected || false

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Notification */}
            {showNotification && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${success ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {success ? (
                        <>
                            <CheckCircle2 className="h-5 w-5" />
                            <span>تم ربط متجر سلة بنجاح!</span>
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
                <h1 className="text-2xl font-bold text-foreground">التكاملات</h1>
                <p className="text-muted-foreground text-sm mt-1">ربط الخدمات الخارجية مع منصتك</p>
            </div>

            {/* Integration Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* Salla Integration Card */}
                <Card>
                    <div className="h-2 bg-[#004D3D]" />
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#004D3D] flex items-center justify-center">
                                    <ShoppingBag className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">سلة</CardTitle>
                                    <CardDescription>Salla E-commerce Platform</CardDescription>
                                </div>
                            </div>
                            {isSallaConnected ? (
                                <Badge className="bg-success text-success-foreground gap-1 text-xs">
                                    <Check className="h-3 w-3" /> متصل
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <AlertCircle className="h-3 w-3" /> غير متصل
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            اربط متجرك على سلة لمزامنة المنتجات والأسعار والمخزون.
                        </p>

                        {isSallaConnected && sallaConnection && (
                            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">اسم المتجر</span>
                                    <span className="font-medium">{sallaConnection.storeName || "غير محدد"}</span>
                                </div>
                                <Link href="/products">
                                    <Button variant="outline" size="sm" className="w-full gap-2">
                                        <Package className="h-4 w-4" />
                                        عرض المنتجات
                                    </Button>
                                </Link>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {isSallaConnected ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={handleDisconnectSalla}
                                >
                                    إلغاء الربط
                                </Button>
                            ) : (
                                <Button
                                    className="flex-1 gap-2 bg-[#004D3D] hover:bg-[#003D2D]"
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                >
                                    {isConnecting ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            جاري الربط...
                                        </>
                                    ) : (
                                        <>
                                            <Link2 className="h-4 w-4" />
                                            ربط متجر سلة
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* WhatsApp Business Integration Card */}
                <Card>
                    <div className="h-2 bg-[#128C7E]" />
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#128C7E] flex items-center justify-center">
                                    <MessageSquare className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">WhatsApp Business</CardTitle>
                                    <CardDescription>Meta WhatsApp Business API</CardDescription>
                                </div>
                            </div>
                            {isMetaConnected ? (
                                <Badge className="bg-success text-success-foreground gap-1 text-xs">
                                    <Check className="h-3 w-3" /> متصل
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <AlertCircle className="h-3 w-3" /> غير متصل
                                </Badge>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            اربط حساب Meta Business لإرسال واستقبال الرسائل عبر WhatsApp.
                        </p>

                        {isMetaConnected && metaConnection && (
                            <div className="p-3 bg-muted/50 rounded-lg space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Phone Number ID</span>
                                    <span className="font-mono text-xs">{metaConnection.phoneNumberId || "غير محدد"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">WABA ID</span>
                                    <span className="font-mono text-xs">{metaConnection.wabaId || "غير محدد"}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            {isMetaConnected ? (
                                <>
                                    <Link href="/integrations/webhook" className="flex-1">
                                        <Button variant="outline" size="sm" className="w-full gap-2">
                                            <Settings className="h-4 w-4" />
                                            إعدادات Webhook
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={handleDisconnectMeta}
                                        disabled={isConnecting}
                                    >
                                        {isConnecting ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            "إلغاء الربط"
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <Link href="/integrations/webhook" className="flex-1">
                                    <Button className="w-full gap-2 bg-[#128C7E] hover:bg-[#0F7A6D]">
                                        <Link2 className="h-4 w-4" />
                                        إعداد WhatsApp
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
