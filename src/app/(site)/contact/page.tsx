"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Mail, MapPin, Phone } from "lucide-react"

export default function ContactPage() {
    return (
        <div className="container mx-auto px-4 max-w-6xl text-right">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-foreground">تواصل معنا</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">فريقنا جاهز للرد على استفساراتك ومساعدتك في تنمية تجارنك</p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-start">
                {/* Contact Info */}
                <div className="space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-[16px] flex items-center justify-center text-primary shrink-0">
                            <Mail className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">البريد الإلكتروني</h3>
                            <p className="text-muted-foreground font-medium">support@w-ai.online</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-[16px] flex items-center justify-center text-primary shrink-0">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">واتساب الدعم</h3>
                            <p className="text-muted-foreground font-medium">+966 500 000 000</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-[16px] flex items-center justify-center text-primary shrink-0">
                            <MapPin className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">المقر الرئيسي</h3>
                            <p className="text-muted-foreground font-medium">الرياض، المملكة العربية السعودية</p>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="bg-muted/30 p-8 rounded-[32px] border border-border/50">
                    <form className="space-y-6">
                        <div className="space-y-2">
                            <label className="font-bold text-sm">الاسم الكامل</label>
                            <Input className="h-12 rounded-[12px] bg-background border-border" placeholder="أدخل اسمك هنا" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-sm">البريد الإلكتروني</label>
                            <Input className="h-12 rounded-[12px] bg-background border-border" placeholder="email@example.com" type="email" />
                        </div>
                        <div className="space-y-2">
                            <label className="font-bold text-sm">كيف يمكننا مساعدتك؟</label>
                            <Textarea className="rounded-[12px] bg-background border-border min-h-[120px]" placeholder="اكتب استفسارك هنا..." />
                        </div>
                        <Button className="w-full h-12 rounded-[16px] font-black text-lg">إرسال الرسالة</Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
