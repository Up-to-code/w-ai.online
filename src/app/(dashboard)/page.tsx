"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

// This page is at route "/" under the dashboard layout
// Redirect to /dashboard which is the actual dashboard page
export default function DashboardRootRedirect() {
    const router = useRouter()
    
    useEffect(() => {
        router.replace("/dashboard")
    }, [router])

    // Show loading while redirecting
    return (
        <div className="flex h-full items-center justify-center" dir="rtl">
            <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">جارٍ التحويل...</p>
            </div>
        </div>
    )
}
