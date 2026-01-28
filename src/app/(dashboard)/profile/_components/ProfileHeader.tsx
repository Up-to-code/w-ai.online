"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { initialsFromName } from "@/lib/utils"
import { Camera, Mail, Phone, Building2 } from "lucide-react"
import { toast } from "sonner"

interface ProfileHeaderProps {
    user: any
    organization?: any
    isEditable?: boolean
}

export function ProfileHeader({ user, organization, isEditable = false }: ProfileHeaderProps) {
    // Helper to translate roles
    const roleName = {
        owner: "مالك",
        admin: "مسؤول",
        agent: "وكيل",
        viewer: "مشاهد"
    }[user.role as string] || user.role || "مستخدم"

    // Minimalist badge styles
    const roleVariant = {
        owner: "default",
        admin: "secondary",
        agent: "outline",
        viewer: "outline"
    }[user.role as string] || "outline"

    // Format joined date
    const joinedDate = user._creationTime
        ? new Date(user._creationTime).toLocaleDateString("ar-SA", { year: 'numeric', month: 'short', day: 'numeric' })
        : null;


    return (
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 py-6">
            {/* Avatar: Large, Clean, Centered on mobile */}
            <div className="relative group shrink-0">
                <Avatar className="h-32 w-32 md:h-44 md:w-44 border border-border/10 shadow-sm text-5xl">
                    <AvatarImage src={user.image} alt={user.name} className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-primary font-light tracking-tighter">
                        {initialsFromName(user.name)}
                    </AvatarFallback>
                </Avatar>
                {isEditable && (
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toast.info("خاصية رفع الصور ستتوفر قريباً")}
                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-background border shadow-sm hover:bg-muted opacity-0 group-hover:opacity-100 transition-all duration-200"
                    >
                        <Camera className="h-4 w-4 text-muted-foreground" />
                    </Button>
                )}
            </div>

            {/* Info: Clean Typography, Left Aligned (LTR) / Right (RTL) */}
            <div className="flex-1 space-y-6 text-center md:text-start">
                <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-4">
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">{user.name}</h1>
                        <Badge variant={roleVariant as any} className="px-3 py-1 rounded-full text-xs font-medium">
                            {roleName}
                        </Badge>
                    </div>
                    {user.title && (
                        <p className="text-xl text-muted-foreground font-medium">{user.title}</p>
                    )}
                </div>

                {/* Metadata: Horizontal Row */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground/80">
                    {user.email && (
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 opacity-70" />
                            <span>{user.email}</span>
                        </div>
                    )}
                    {user.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 opacity-70" />
                            <span dir="ltr">{user.phone}</span>
                        </div>
                    )}
                    {organization && (
                        <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 opacity-70" />
                            <span>{organization.name}</span>
                        </div>
                    )}
                </div>

                {/* Bio (if exists) */}
                {user.bio && (
                    <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto md:mx-0">
                        {user.bio}
                    </p>
                )}
            </div>
        </div>
    )
}
