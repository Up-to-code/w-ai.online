"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUserContext } from "@/hooks/useUserContext"
import { initialsFromName } from "@/lib/utils"
import { LogOut, Settings, User } from "lucide-react"
import Link from "next/link"

export function UserNav() {
    const { user, workOSUser } = useUserContext()

    if (!workOSUser) return null

    // Fallback Logic: DB User > WorkOS User
    const displayName = user?.name || [workOSUser.firstName, workOSUser.lastName].filter(Boolean).join(" ") || "User"
    const displayEmail = user?.email || workOSUser.email
    const displayImage = user?.image || workOSUser.profilePictureUrl || undefined

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-border/50">
                        <AvatarImage src={displayImage} alt={displayName} className="object-cover" />
                        <AvatarFallback>{initialsFromName(displayName)}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 text-start" align="end" forceMount>
                <DropdownMenuLabel className="font-normal text-start">
                    <div className="flex flex-col space-y-1 text-start">
                        <p className="text-sm font-medium leading-none text-start">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground text-start">
                            {displayEmail}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link href="/profile">
                        <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4 ml-2" />
                            <span>الملف الشخصي</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/settings">
                        <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4 ml-2" />
                            <span>الإعدادات</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                {/* WorkOS Logout Link - Standard Pattern */}
                <a href={process.env.NEXT_PUBLIC_WORKOS_LOGOUT_URL || "/"} className="w-full cursor-pointer">
                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4 ml-2" />
                        <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                </a>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
