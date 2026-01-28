"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ProfileFormProps {
    user: any
}

export function ProfileForm({ user }: ProfileFormProps) {
    const updateProfile = useMutation(api.users.updateProfile)
    const [isLoading, setIsLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const [formData, setFormData] = useState({
        name: user.name || "",
        phone: user.phone || "",
        title: user.title || "",
        bio: user.bio || "",
    })

    // Handle changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation
        if (!formData.name.trim()) {
            toast.error("الاسم مطلوب")
            return
        }

        setIsLoading(true)
        try {
            await updateProfile({
                userId: user._id,
                name: formData.name,
                phone: formData.phone,
                title: formData.title,
                bio: formData.bio,
            })
            toast.success("تم تحديث الملف الشخصي بنجاح")
            setIsEditing(false)
        } catch (error) {
            console.error(error)
            toast.error("حدث خطأ أثناء التحديث")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-6">
                <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">المعلومات الشخصية</CardTitle>
                    <CardDescription className="text-base">
                        {isEditing
                            ? "قم بتحديث معلوماتك الشخصية أدناه."
                            : "معلوماتك الشخصية كما تظهر للآخرين."}
                    </CardDescription>
                </div>
                <Button
                    variant={isEditing ? "ghost" : "outline"}
                    onClick={() => setIsEditing(!isEditing)}
                >
                    {isEditing ? "إلغاء" : "تعديل المعلومات"}
                </Button>
            </CardHeader>
            <CardContent>
                {!isEditing ? (
                    /* View Mode */
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">الاسم الكامل</Label>
                                <p className="font-semibold text-lg text-foreground">{user.name}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">المسمى الوظيفي</Label>
                                <p className="font-semibold text-lg text-foreground">{user.title || "-"}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">البريد الإلكتروني</Label>
                                <p className="font-semibold text-lg text-foreground dir-ltr text-right">{user.email}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground text-xs uppercase tracking-wider">رقم الهاتف</Label>
                                <p className="font-semibold text-lg text-foreground dir-ltr text-right">{user.phone || "-"}</p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-6 border-t border-border/50">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">نبذة عنك</Label>
                            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{user.bio || "لا توجد نبذة"}</p>
                        </div>
                    </div>
                ) : (
                    /* Edit Mode */
                    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم الكامل <span className="text-destructive">*</span></Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="اسمك الكامل"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">المسمى الوظيفي</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="مثال: مدير المبيعات"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input
                                    id="email"
                                    value={user.email}
                                    disabled
                                    className="bg-muted text-muted-foreground"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    يتم إدارة البريد الإلكتروني عبر حساب WorkOS الخاص بك.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الهاتف</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+966..."
                                    dir="ltr"
                                    className="text-right"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">نبذة عنك</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="اكتب نبذة مختصرة عن نفسك..."
                                className="resize-none min-h-[100px]"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-border/50 gap-2">
                            <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>إلغاء</Button>
                            <Button type="submit" disabled={isLoading} className="gap-2 min-w-[120px]">
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                حفظ التغييرات
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    )
}
