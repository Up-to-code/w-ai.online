"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  MessageSquare,
  Megaphone,
  Settings,
  LogOut,
  Search,
  Bell,
  Menu,
  FileText,
  Radio,
  Zap,
  Users,
  Package,
  Link2,
  ShoppingBag,
  Bot,
  UserCog,
  ArrowRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DashboardHeaderProvider, useDashboardHeader } from "@/components/DashboardHeaderContext"
import { Toaster } from "sonner"
import { GlobalNotification } from "@/components/GlobalNotification"
import { Suspense } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { OrganizationSelector } from "@/components/OrganizationSelector"
import { CreateOrganizationModal } from "@/components/CreateOrganizationModal"
import { Loader2, User, Building2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AvatarImage } from "@/components/ui/avatar"
import { initialsFromName } from "@/lib/utils"

// Navigation items for the sidebar
const navigationItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/chat", icon: MessageSquare, label: "المحادثات" },
  { href: "/campaigns", icon: Megaphone, label: "الحملات" },
  { href: "/customers", icon: Users, label: "العملاء" },
  { href: "/products", icon: Package, label: "المنتجات" },
  { href: "/templates", icon: FileText, label: "القوالب" },
  { href: "/workflows", icon: Zap, label: "الأتمتة" },
  { href: "/integrations", icon: Link2, label: "التكاملات" },
  { href: "/ai-settings", icon: Bot, label: "إعدادات الذكاء" },
  { href: "/users", icon: UserCog, label: "المستخدمين" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
]

// Sidebar Content Component
function SidebarContent({ pathname }: { pathname: string }) {
  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Logo/Branding */}
      <div className="p-6 border-b border-sidebar-border flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold text-sidebar-foreground">w-ai.online</h1>
            <p className="text-xs text-muted-foreground">أتمت واتساب للأعمال</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function DashboardHeader({ pathname }: { pathname: string }) {
  const { content } = useDashboardHeader()
  const router = useRouter()
  const pathSegments = pathname.split("/").filter(Boolean)
  const showBack = pathSegments.length >= 2

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.back()}
            aria-label="رجوع"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 border-l border-sidebar-border w-72">
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Sheet>

        {content ? (
          <div className="flex-1 min-w-0">{content}</div>
        ) : (
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث..." className="pr-10 bg-background border-border" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <OrganizationSelector />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
        </Button>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated, workOSUser, userId } = useUserContext()
  const { isLoading: isOrgLoading, hasOrganization, currentOrganization, organizations } = useOrganizationContext()

  // Log state for debugging
  useEffect(() => {
    console.log("[DashboardLayout] State:", {
      isLoading,
      isOrgLoading,
      hasOrganization,
      userId,
      workOSUser: !!workOSUser,
      currentOrganization: currentOrganization ? "exists" : currentOrganization === null ? "null" : "undefined",
      organizationsCount: organizations?.length || 0,
      pathname,
    });
  }, [isLoading, isOrgLoading, hasOrganization, userId, workOSUser, currentOrganization, organizations, pathname]);

  useEffect(() => {
    // Wait for authentication to settle; if unauthenticated, force full navigation
    // so AuthKit middleware runs and redirects to WorkOS (router.push may not trigger it)
    // Only redirect if we're not already on /dashboard to prevent infinite loops
    if (!isLoading && !workOSUser && pathname !== "/dashboard") {
      window.location.href = "/dashboard"
      return
    }
  }, [isLoading, workOSUser, pathname])

  // Show loading state while checking authentication or organization
  if (isLoading || isOrgLoading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جارٍ التحقق من الهوية...</p>
        </div>
      </div>
    )
  }

  // Only block if truly unauthenticated (no WorkOS user at all)
  if (!workOSUser) {
    return null
  }

  // Block access if user doesn't have an organization
  // Only show modal if we're sure there's no organization (not just loading)
  // Additional safety check: ensure userId exists and we're not in a loading state
  if (!hasOrganization && !isOrgLoading && userId) {
    console.log("[DashboardLayout] Showing CreateOrganizationModal - no organization found", {
      hasOrganization,
      isOrgLoading,
      userId,
      currentOrganization: currentOrganization ? "exists" : currentOrganization === null ? "null" : "undefined",
      organizationsCount: organizations?.length || 0,
    });
    return (
      <div className="flex h-screen items-center justify-center bg-background" dir="rtl">
        <CreateOrganizationModal open={true} onOpenChange={() => {}} blocking={true} />
      </div>
    )
  }

  return (
    <DashboardHeaderProvider>
      <div className="flex h-screen bg-background font-sans" dir="rtl">
        <aside className="hidden md:flex w-64 border-l border-sidebar-border flex-col">
          <SidebarContent pathname={pathname} />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader pathname={pathname} />

          <main className="flex-1 overflow-auto bg-background">{children}</main>
        </div>

        {/* Global Notifications */}
        <Toaster position="top-right" expand={true} richColors visibleToasts={4} />
        <Suspense fallback={null}>
          <GlobalNotification />
        </Suspense>
      </div>
    </DashboardHeaderProvider>
  )
}
