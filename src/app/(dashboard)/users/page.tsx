"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  Edit2,
  Save,
  X,
  Plus,
  Mail,
  Clock,
  Trash2
} from "lucide-react"
import { toast } from "sonner"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useUserContext } from "@/hooks/useUserContext"
import { Id } from "@convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input as UiInput } from "@/components/ui/input"

type UserRole = "admin" | "agent" | "user"

const roleLabels: Record<UserRole, string> = {
  admin: "مدير",
  agent: "وكيل",
  user: "مستخدم",
}

const roleVariants: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  agent: "secondary",
  user: "outline",
}

export default function UsersPage() {
  const { currentOrganization } = useOrganizationContext()
  const { userId } = useUserContext()

  const users = useQuery(
    api.users.list,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  ) || []

  const invitations = useQuery(
    api.invitations.listPending,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  ) || []

  const updateMemberRole = useMutation(api.organizations.updateMemberRole)
  const inviteMember = useMutation(api.invitations.invite)
  const cancelInvite = useMutation(api.invitations.cancelInvite)

  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Invitation Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "agent" | "viewer">("agent")
  const [isInviting, setIsInviting] = useState(false)

  const userRoleInOrg = currentOrganization?.role || "viewer"
  const canManageUsers = userRoleInOrg === "owner" || userRoleInOrg === "admin"

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization || !userId) return

    setIsInviting(true)
    try {
      await inviteMember({
        organizationId: currentOrganization._id,
        invitedBy: userId as Id<"users">,
        email: inviteEmail,
        role: inviteRole,
      })
      toast.success("تم إرسال الدعوة بنجاح")
      setIsInviteModalOpen(false)
      setInviteEmail("")
    } catch (error: any) {
      toast.error(error.message || "فشل إرسال الدعوة")
    } finally {
      setIsInviting(false)
    }
  }

  const handleCancelInvite = async (id: Id<"invitations">) => {
    if (!userId) return
    try {
      await cancelInvite({ inviteId: id, userId: userId as Id<"users"> })
      toast.success("تم إلغاء الدعوة")
    } catch (error: any) {
      toast.error("فشل إلغاء الدعوة")
    }
  }

  const handleEdit = (user: any) => {
    setEditingUserId(user._id)
    setSelectedRole(user.role)
  }

  const handleCancel = () => {
    setEditingUserId(null)
    setSelectedRole(null)
  }

  const handleSave = async (memberUserId: string) => {
    if (!selectedRole || !currentOrganization || !userId) return

    setIsSaving(true)
    try {
      await updateMemberRole({
        userId: userId as Id<"users">,
        organizationId: currentOrganization._id,
        memberUserId: memberUserId as Id<"users">,
        role: selectedRole as any,
      })
      toast.success("تم تحديث الدور بنجاح")
      setEditingUserId(null)
      setSelectedRole(null)
    } catch (error: any) {
      toast.error("فشل تحديث الدور: " + (error.message || "خطأ غير معروف"))
    } finally {
      setIsSaving(false)
    }
  }

  const getInitials = (name?: string, email?: string, phone?: string) => {
    if (name) {
      const parts = name.split(" ")
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    if (phone) {
      return phone.slice(-2)
    }
    return "م"
  }

  return (
    <div className="space-y-6 m-16">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">إدارة المستخدمين</h1>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            عرض وتعديل أدوار المستخدمين والدعوات في النظام
          </p>
        </div>

        {canManageUsers && (
          <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                دعوة عضو جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
              <form onSubmit={handleInvite}>
                <DialogHeader>
                  <DialogTitle>دعوة عضو جديد</DialogTitle>
                  <DialogDescription>
                    أدخل البريد الإلكتروني للشخص الذي تود دعوته لهذه المنظمة.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <UiInput
                      id="email"
                      type="email"
                      placeholder="example@w-ai.online"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">الدور</Label>
                    <Select
                      value={inviteRole}
                      onValueChange={(v) => setInviteRole(v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر دوراً" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="agent">وكيل</SelectItem>
                        <SelectItem value="viewer">مشاهد</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? "جاري الإرسال..." : "إرسال الدعوة"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين</CardTitle>
          <CardDescription>
            إجمالي: {users.length} مستخدم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              لا يوجد مستخدمين
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => {
                const isEditing = editingUserId === user._id
                const initials = getInitials(user.name, user.email, user.phone)

                return (
                  <div
                    key={user._id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {initials}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {user.name || user.email || user.phone || "بدون اسم"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {user.email && (
                            <p className="text-sm text-muted-foreground truncate">
                              {user.email}
                            </p>
                          )}
                          {user.phone && (
                            <p className="text-sm text-muted-foreground truncate">
                              {user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <>
                          <Select
                            value={selectedRole || undefined}
                            onValueChange={(value) => setSelectedRole(value as UserRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مدير</SelectItem>
                              <SelectItem value="agent">وكيل</SelectItem>
                              <SelectItem value="user">مستخدم</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleSave(user._id)}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            <Save className="h-4 w-4" />
                            حفظ
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            إلغاء
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant={roleVariants[user.role as UserRole]}>
                            {roleLabels[user.role as UserRole]}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            className="gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            تعديل
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              دعوات معلقة
            </CardTitle>
            <CardDescription>
              الأشخاص الذين تمت دعوتهم بانتظار الانضمام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invite: any) => (
                <div
                  key={invite._id}
                  className="flex items-center justify-between p-4 border rounded-xl bg-muted/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-5">
                          {roleLabels[invite.role as UserRole]}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          صالح حتى {new Date(invite.expiresAt).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {canManageUsers && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancelInvite(invite._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
