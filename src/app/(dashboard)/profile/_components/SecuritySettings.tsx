"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Key, Building2, UserCog } from "lucide-react"

interface SecuritySettingsProps {
    user: any
    organization?: any
}

export function SecuritySettings({ user, organization }: SecuritySettingsProps) {
    // Helper to translate roles
    const roleName = {
        owner: "مالك",
        admin: "مسؤول",
        agent: "وكيل",
        viewer: "مشاهد"
    }[user.role as string] || user.role || "مستخدم"

    const roleDescription = {
        owner: "صلاحيات كاملة لإدارة المنظمة والفريق والاشتراكات.",
        admin: "صلاحيات كاملة لإدارة جهات الاتصال والمحادثات.",
        agent: "يمكنه الرد على المحادثات وإدارة جهات الاتصال المسندة.",
        viewer: "صلاحيات عرض فقط للتقارير والمحادثات.",
    }[user.role as string] || "صلاحيات محدودة."

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle>الأمان والصلاحيات</CardTitle>
                <CardDescription>
                    تفاصيل حسابك، الصلاحيات، وإدارة الدخول.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* 1. Auth Method */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Key className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-sm">طريقة الدخول</p>
                            <p className="text-muted-foreground text-xs leading-relaxed">
                                يتم تسجيل الدخول وإدارة كلمات المرور بشكل آمن عبر <strong>WorkOS</strong>.
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="bg-background">
                        SSO / Social Login
                    </Badge>
                </div>

                {/* 2. Role Info */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <UserCog className="h-4 w-4" />
                            <p className="text-xs uppercase tracking-wider">الدور الحالي</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="font-semibold text-lg">{roleName}</p>
                            <Badge variant="secondary" className="text-[10px]">
                                {user.role}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {roleDescription}
                        </p>
                    </div>

                    {organization && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <Building2 className="h-4 w-4" />
                                <p className="text-xs uppercase tracking-wider">المنظمة</p>
                            </div>
                            <p className="font-semibold text-lg">{organization.name}</p>
                            <p className="text-xs text-muted-foreground font-mono dir-ltr text-right">
                                ID: {organization._id}
                            </p>
                        </div>
                    )}
                </div>

                {/* 3. Security Notice */}
                <div className="pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3 text-amber-600/90 bg-amber-50/50 p-4 rounded-lg border border-amber-100/50 dark:bg-amber-950/10 dark:text-amber-500 dark:border-amber-900/20">
                        <Shield className="h-5 w-5 shrink-0" />
                        <p className="text-sm">
                            لأسباب أمنية، يجب التواصل مع مسؤول النظام لتغيير الصلاحيات أو دعوة أعضاء جدد.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
