"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function Navbar() {
    const router = useRouter()
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    return (
        <header className={cn(
            "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
            scrolled ? "bg-background/80 backdrop-blur-md border-b border-border/50 py-3" : "bg-transparent py-5"
        )}>
            <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
                <div className="flex items-center group cursor-pointer" onClick={() => router.push("/")}>
                    <div className="relative w-28 h-10 overflow-hidden">
                        <Image
                            src="/bg-non.png"
                            alt="w-ai.online Logo"
                            fill
                            className="object-contain object-right"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.push("/login")} className="hidden md:inline-flex font-bold rounded-[12px]">تسجيل دخول</Button>
                    <Button onClick={() => router.push("/dashboard")} className="font-bold rounded-[12px] px-6 transition-all">ابدأ الآن مجاناً</Button>
                </div>
            </div>
        </header>
    )
}
