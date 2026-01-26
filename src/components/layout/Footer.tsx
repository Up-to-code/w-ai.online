"use client"

import Image from "next/image"
import Link from "next/link"

export function Footer() {
    return (
        <footer className="py-20 border-t border-border/50 bg-muted/5 relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 items-start text-right">
                    <div className="md:col-span-2 space-y-6">
                        <div className="relative w-32 h-10 overflow-hidden">
                            <Image
                                src="/bg-non.png"
                                alt="w-ai.online Logo"
                                fill
                                className="object-contain object-right"
                            />
                        </div>
                        <p className="text-muted-foreground max-w-sm text-lg leading-relaxed">
                            المنصة الأولى المعتمدة لزيادة مبيعات المتاجر عبر واتساب والذكاء الاصطناعي في الوطن العربي.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-black text-foreground uppercase tracking-wider text-sm">عن المنصة</h4>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors font-medium">عن w-ai.online</Link></li>
                            <li><Link href="/#pricing" className="text-muted-foreground hover:text-primary transition-colors font-medium">الأسعار</Link></li>
                            <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors font-medium">اتصل بنا</Link></li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-black text-foreground uppercase tracking-wider text-sm">الدعم القانوني</h4>
                        <ul className="space-y-3">
                            <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors font-medium">الشروط والأحكام</Link></li>
                            <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors font-medium">سياسة الخصوصية</Link></li>
                            <li><Link href="/refund" className="text-muted-foreground hover:text-primary transition-colors font-medium">سياسة الاسترجاع</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-border/10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-sm text-muted-foreground font-bold">
                        © 2026 w-ai.online. جميع الحقوق محفوظة.
                    </div>
                    <div className="flex gap-6 grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all">
                        <div className="font-black text-xs uppercase tracking-tighter">Twitter</div>
                        <div className="font-black text-xs uppercase tracking-tighter">Instagram</div>
                        <div className="font-black text-xs uppercase tracking-tighter">LinkedIn</div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
