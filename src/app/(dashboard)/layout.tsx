"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
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
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Calendar
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
import { initialsFromName, cn } from "@/lib/utils"

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
function SidebarContent({ pathname, isCollapsed, onToggle }: { pathname: string; isCollapsed?: boolean; onToggle?: () => void }) {
  const { currentOrganization } = useOrganizationContext()
  const { userId } = useUserContext()
  const activeTools = useQuery(api.organizationTools.getActiveTools, userId ? { userId } : "skip")

  // Memoize active tools for easy lookup
  const activeToolIds = (activeTools || []).map((t: any) => t.toolId)

  // Define groups
  interface SidebarItem {
    href: string;
    icon: any;
    label: string;
    toolId?: string;
    alwaysVisible?: boolean;
  }

  interface SidebarGroup {
    id: string;
    label: string;
    items: SidebarItem[];
  }

  const groups: SidebarGroup[] = [
    {
      id: "core",
      label: "الرئيسية",
      items: [
        { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم", alwaysVisible: true },
        { href: "/chat", icon: MessageSquare, label: "المحادثات", alwaysVisible: true },
        { href: "/customers", icon: Users, label: "العملاء", alwaysVisible: true },
      ]
    },
    {
      id: "marketing",
      label: "التسويق",
      items: [
        { href: "/campaigns", icon: Megaphone, label: "الحملات", toolId: "campaigns", alwaysVisible: true }, // Core feature for now
        { href: "/templates", icon: FileText, label: "القوالب", toolId: "templates", alwaysVisible: true },
        { href: "/workflows", icon: Zap, label: "الأتمتة", toolId: "workflows", alwaysVisible: true },
      ]
    },
    {
      id: "tools",
      label: "الأدوات",
      items: [
        { href: "/products", icon: Package, label: "المنتجات", toolId: "products", alwaysVisible: true }, // Core for now
        { href: "/bookings", icon: Calendar, label: "الحجوزات", toolId: "bookings" }, // New optional tool
      ]
    },
    {
      id: "settings",
      label: "الإعدادات",
      items: [
        { href: "/integrations", icon: Link2, label: "التكاملات", alwaysVisible: true },
        { href: "/ai-settings", icon: Bot, label: "إعدادات الذكاء", alwaysVisible: true },
        { href: "/users", icon: UserCog, label: "المستخدمين", alwaysVisible: true },
        { href: "/settings", icon: Settings, label: "الإعدادات", alwaysVisible: true },
      ]
    }
  ]

  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo/Branding */}
      <div className={cn(
        "p-6 border-b border-sidebar-border/50 flex items-center gap-3",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        <div className={cn("flex items-center gap-4", isCollapsed && "justify-center")}>
          <div className={cn("relative shrink-0", isCollapsed ? "w-10 h-10" : "w-32 h-10")}>
            <Image
              src="/bg-non.png"
              alt="W-AI Logo"
              fill
              className={cn("object-contain", isCollapsed ? "object-center" : "object-right")}
            />
          </div>
        </div>

        {/* Toggle button inside sidebar for desktop */}
        {onToggle && !isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex h-8 w-8 text-muted-foreground hover:text-primary rounded-[10px]"
            onClick={onToggle}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto overflow-x-hidden">
        {groups.map((group) => {
          // Filter items based on active tools
          const visibleItems = group.items.filter(item =>
            item.alwaysVisible || (item.toolId && activeToolIds.includes(item.toolId))
          )

          if (visibleItems.length === 0) return null

          return (
            <div key={group.id} className="space-y-2">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-muted-foreground/50 px-3 select-none">
                  {group.label}
                </h3>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all group",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isCollapsed && "justify-center px-0 h-11"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0 transition-transform group-hover:scale-110", isActive && "scale-105")} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Footer / Toggle for collapsed state */}
      {isCollapsed && onToggle && (
        <div className="p-4 border-t border-sidebar-border/50 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-primary rounded-[12px]"
            onClick={onToggle}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}

function DashboardHeader({ pathname, isCollapsed, onToggle }: { pathname: string; isCollapsed?: boolean; onToggle?: () => void }) {
  const { content } = useDashboardHeader()
  const { currentOrganization } = useOrganizationContext()
  const unreadCount = useQuery(
    api.notifications.unreadCount,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  ) || 0
  const router = useRouter()
  const pathSegments = pathname.split("/").filter(Boolean)
  const showBack = pathSegments.length >= 2

  return (
    <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-4 sm:px-6 gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Toggle for desktop if isCollapsed and button not in sidebar */}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex shrink-0 h-9 w-9 rounded-[10px]"
            onClick={onToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-[10px]"
            onClick={() => router.back()}
            aria-label="رجوع"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden shrink-0 rounded-[10px]">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="p-0 border-l border-sidebar-border/50 w-72">
            <SidebarContent pathname={pathname} />
          </SheetContent>
        </Sheet>

        {content ? (
          <div className="flex-1 min-w-0">{content}</div>
        ) : (
          <div className="relative max-w-md w-full hidden sm:block">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="البحث..." className="pr-10 bg-background border-border/50 rounded-[12px]" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <OrganizationSelector />
        <Button variant="ghost" size="icon" className="relative rounded-[10px]">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-destructive text-[10px] font-bold text-destructive-foreground rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "+9" : unreadCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoading, isAuthenticated, workOSUser, userId } = useUserContext()
  const { isLoading: isOrgLoading, hasOrganization, currentOrganization, organizations } = useOrganizationContext()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSidebar = () => setIsCollapsed(!isCollapsed)

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
      isCollapsed,
    });
  }, [isLoading, isOrgLoading, hasOrganization, userId, workOSUser, currentOrganization, organizations, pathname, isCollapsed]);

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
  // Also show loading if user is authenticated (WorkOS) but not yet synced to DB (no userId)
  if (isLoading || isOrgLoading || (workOSUser && !userId)) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {isLoading || (workOSUser && !userId) ? "جارٍ تسجيل الدخول..." : "جارٍ تحميل البيانات..."}
          </p>
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
        <CreateOrganizationModal open={true} onOpenChange={() => { }} blocking={true} />
      </div>
    )
  }

  return (
    <DashboardHeaderProvider>
      <div className="flex h-screen bg-background font-sans overflow-hidden" dir="rtl">
        <aside className={cn(
          "hidden md:flex border-l border-sidebar-border/50 flex-col transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}>
          <SidebarContent pathname={pathname} isCollapsed={isCollapsed} onToggle={toggleSidebar} />
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader pathname={pathname} isCollapsed={isCollapsed} onToggle={toggleSidebar} />

          <main className="flex-1 overflow-auto bg-background/50 relative">{children}</main>
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

