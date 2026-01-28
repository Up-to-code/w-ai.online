"use client"

import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { ProfileHeader } from "./_components/ProfileHeader"
import { ProfileForm } from "./_components/ProfileForm"
import { SecuritySettings } from "./_components/SecuritySettings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserCog, History, Shield } from "lucide-react"

export default function ProfilePage() {
    const { userId, user, workOSUser, isLoading } = useUserContext()
    const { currentOrganization } = useOrganizationContext()

    // Fetch user role if not in user object directly (depends on schema/sync)
    // But usually user object has basic info. We can fetch role specifically if needed.
    const role = useQuery(api.permissions.getCurrentUserRole, userId ? { userId } : "skip")

    // Enhance user object with role & image fallback
    const userWithRole = user ? {
        ...user,
        role: role || user.role,
        image: user.image || workOSUser?.profilePictureUrl
    } : null

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        )
    }

    if (!userWithRole) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                    فشل تحميل بيانات المستخدم. الرجاء المحاولة مرة أخرى لاحقاً.
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-6xl mx-auto py-10 space-y-10">
            {/* 1. Header Section */}
            <ProfileHeader
                user={userWithRole}
                organization={currentOrganization}
                isEditable={true}
            />

            {/* 2. Vertical Settings Layout */}
            <Tabs defaultValue="general" orientation="vertical" className="flex flex-col md:flex-row rtl:md:flex-row-reverse gap-10 items-start">
                {/* Sidebar Navigation */}
                <aside className="w-full md:w-64 shrink-0">
                    <TabsList className="flex flex-col h-auto p-0 bg-transparent space-y-1 w-full">
                        <TabsTrigger
                            value="general"
                            className="w-full justify-start px-4 py-3 h-auto text-base font-medium rounded-lg hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
                        >
                            <UserCog className="h-4 w-4 ml-2 rtl:ml-2 ltr:mr-2" />
                            <span>المعلومات الشخصية</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="w-full justify-start px-4 py-3 h-auto text-base font-medium rounded-lg hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
                        >
                            <Shield className="h-4 w-4 ml-2 rtl:ml-2 ltr:mr-2" />
                            <span>الأمان والصلاحيات</span>
                        </TabsTrigger>
                    </TabsList>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 w-full max-w-3xl">
                    <TabsContent value="general" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <ProfileForm user={userWithRole} />
                    </TabsContent>

                    <TabsContent value="security" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <SecuritySettings user={userWithRole} organization={currentOrganization} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
