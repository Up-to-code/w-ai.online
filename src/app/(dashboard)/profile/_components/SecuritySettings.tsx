"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Shield, Key, Building2, UserCog, Settings, Users, Plus, Trash2, Mail } from "lucide-react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { toast } from "sonner"
import { Id } from "@convex/_generated/dataModel"

interface SecuritySettingsProps {
    user: any
    organization?: any
}

export function SecuritySettings({ user, organization }: SecuritySettingsProps) {
    const isOwner = user.role === "owner"
    const isAdmin = user.role === "admin"
    const canManageTeam = isOwner || isAdmin

    // Org Edit State
    const [isEditingOrg, setIsEditingOrg] = useState(false)
    const [orgName, setOrgName] = useState(organization?.name || "")
    const [orgSlug, setOrgSlug] = useState(organization?.slug || "")
    const updateOrg = useMutation(api.organizations.updateOrganization)

    // Sync state with prop
    // This ensures that when the organization data loads or changes, the dialog reflects the correct values
    useEffect(() => {
        setOrgName(organization?.name || "")
        setOrgSlug(organization?.slug || "")
    }, [organization])

    // Invite State
    const [isInviting, setIsInviting] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState<"admin" | "agent" | "viewer">("viewer")
    const inviteUser = useMutation(api.invitations.invite)

    // Members Data
    const members = useQuery(api.organizations.getMembers, organization ? { organizationId: organization._id } : "skip")
    const removeMember = useMutation(api.organizations.removeMember)

    // Handlers
    const handleUpdateOrg = async () => {
        try {
            await updateOrg({
                userId: user._id,
                organizationId: organization._id,
                name: orgName,
                // Slug is immutable
            })
            toast.success("تم تحديث بيانات المنظمة بنجاح")
            setIsEditingOrg(false)
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء التحديث")
        }
    }

    const handleInvite = async () => {
        if (!inviteEmail) return
        try {
            await inviteUser({
                organizationId: organization._id,
                invitedBy: user._id,
                email: inviteEmail,
                role: inviteRole
            })
            toast.success("تم إرسال الدعوة بنجاح")
            setIsInviting(false)
            setInviteEmail("")
        } catch (error: any) {
            toast.error(error.message || "فشل إرسال الدعوة")
        }
    }

    const handleRemoveMember = async (memberId: Id<"users">) => {
        if (!confirm("هل أنت متأكد من إزالة هذا العضو؟")) return
        try {
            await removeMember({
                organizationId: organization._id,
                userId: user._id,
                memberUserId: memberId
            })
            toast.success("تم إزالة العضو بنجاح")
        } catch (error: any) {
            toast.error(error.message || "فشل إزالة العضو")
        }
    }

    // Role Translation
    const getRoleName = (role: string) => ({
        owner: "مالك",
        admin: "مسؤول",
        agent: "وكيل",
        viewer: "مشاهد"
    }[role] || role)

    return (
        <div className="space-y-6">
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

                    {/* 2. Org & Role Info */}
                    <div className="grid gap-6 md:grid-cols-2">
                        {organization && (
                            <div className="space-y-2 p-4 border rounded-lg bg-card/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                        <Building2 className="h-4 w-4" />
                                        <p className="text-xs uppercase tracking-wider">المنظمة</p>
                                    </div>
                                    {isOwner && (
                                        <Dialog open={isEditingOrg} onOpenChange={setIsEditingOrg}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>تعديل بيانات المنظمة</DialogTitle>
                                                    <DialogDescription>
                                                        قم بتحديث اسم ومعرف المنظمة.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label>اسم المنظمة</Label>
                                                        <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>المعرف (Slug)</Label>
                                                        <Input
                                                            value={orgSlug}
                                                            readOnly
                                                            disabled
                                                            className="font-mono text-sm bg-muted text-muted-foreground"
                                                        />
                                                        <p className="text-[10px] text-muted-foreground">
                                                            لا يمكن تغيير معرف المنظمة بعد الإنشاء.
                                                        </p>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsEditingOrg(false)}>إلغاء</Button>
                                                    <Button onClick={handleUpdateOrg}>حفظ التغييرات</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </div>
                                <p className="font-semibold text-lg">{organization.name}</p>
                                <p className="text-xs text-muted-foreground font-mono dir-ltr text-right">
                                    ID: {organization.slug || organization._id}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2 p-4 border rounded-lg bg-card/50">
                            <div className="flex items-center gap-2 text-muted-foreground mb-1">
                                <UserCog className="h-4 w-4" />
                                <p className="text-xs uppercase tracking-wider">الدور الحالي</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <p className="font-semibold text-lg">{getRoleName(user.role)}</p>
                                <Badge variant="secondary" className="text-[10px]">
                                    {user.role}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {isOwner ? "لديك كامل الصلاحيات لإدارة الفريق والإعدادات." :
                                    isAdmin ? "يمكنك إدارة الفريق والعملاء والمحادثات." :
                                        "يمكنك الوصول للميزات المخصصة لك فقط."}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Team Management (Visible to Admins/Owners) */}
            {canManageTeam && (
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                إدارة الفريق
                            </CardTitle>
                            <CardDescription>
                                قم بدعوة أعضاء جدد وإدارة صلاحياتهم.
                            </CardDescription>
                        </div>
                        <Dialog open={isInviting} onOpenChange={setIsInviting}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    دعوة عضو
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>دعوة عضو جديد</DialogTitle>
                                    <DialogDescription>
                                        سيتم إرسال دعوة عبر البريد الإلكتروني للانضمام للمنظمة.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>البريد الإلكتروني</Label>
                                        <Input
                                            type="email"
                                            placeholder="user@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>الدور</Label>
                                        <Select
                                            value={inviteRole}
                                            onValueChange={(v: any) => setInviteRole(v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">مسؤول (Admin)</SelectItem>
                                                <SelectItem value="agent">وكيل (Agent)</SelectItem>
                                                <SelectItem value="viewer">مشاهد (Viewer)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsInviting(false)}>إلغاء</Button>
                                    <Button onClick={handleInvite}>إرسال الدعوة</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-right">الاسم</TableHead>
                                        <TableHead className="text-right">البريد الإلكتروني</TableHead>
                                        <TableHead className="text-right">الدور</TableHead>
                                        <TableHead className="text-right">تاريخ الانضمام</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members ? members.map((member: any) => (
                                        <TableRow key={member._id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                        {member.name?.[0] || "?"}
                                                    </span>
                                                    {member.name}
                                                </div>
                                            </TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{getRoleName(member.role)}</Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {new Date(member.joinedAt).toLocaleDateString("ar-SA")}
                                            </TableCell>
                                            <TableCell>
                                                {isOwner && member._id !== user._id && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleRemoveMember(member._id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        // Skeleton
                                        [...Array(3)].map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><div className="h-4 w-24 bg-muted/50 rounded animate-pulse" /></TableCell>
                                                <TableCell><div className="h-4 w-32 bg-muted/50 rounded animate-pulse" /></TableCell>
                                                <TableCell><div className="h-4 w-16 bg-muted/50 rounded animate-pulse" /></TableCell>
                                                <TableCell><div className="h-4 w-20 bg-muted/50 rounded animate-pulse" /></TableCell>
                                                <TableCell />
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
