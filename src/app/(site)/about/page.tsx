"use client"

import { motion } from "framer-motion"
import { Users, Target, Rocket, Heart } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 max-w-5xl text-right">
            <div className="text-center mb-16 space-y-4">
                <h1 className="text-5xl font-black text-foreground">عن w-ai.online</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">نحن هنا لنغير طريقة نمو التجارة الإلكترونية في الوطن العربي</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                <div className="space-y-6">
                    <h2 className="text-3xl font-black text-foreground border-r-4 border-primary pr-4">رؤيتنا</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        أن نكون الشريك التقني الأول لكل تاجر طموح، من خلال توفير أدوات ذكاء اصطناعي تفهم اللغة واللهجة العربية، وتبسط عمليات البيع والتواصل لتجعلها آلية بالكامل وبأعلى كفاءة.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-6 rounded-[24px] text-center space-y-2">
                        <Users className="h-8 w-8 text-primary mx-auto" />
                        <div className="text-2xl font-black text-foreground">1500+</div>
                        <div className="text-xs text-muted-foreground font-bold">متجر يثق بنا</div>
                    </div>
                    <div className="bg-muted/30 p-6 rounded-[24px] text-center space-y-2">
                        <Target className="h-8 w-8 text-primary mx-auto" />
                        <div className="text-2xl font-black text-foreground">98%</div>
                        <div className="text-xs text-muted-foreground font-bold">معدل تحويل</div>
                    </div>
                </div>
            </div>

            <div className="bg-primary/5 rounded-[32px] p-12 border border-primary/10 mb-24">
                <h2 className="text-3xl font-black text-foreground mb-8 text-center">قيمنا الجوهرية</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="text-center space-y-3">
                        <div className="h-12 w-12 bg-white rounded-[16px] flex items-center justify-center mx-auto text-primary">
                            <Rocket className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg">الابتكار المستمر</h3>
                        <p className="text-sm text-muted-foreground">نطور أدواتنا يومياً لنواكب سرعة التغير في عالم التجارة الإلكترونية.</p>
                    </div>
                    <div className="text-center space-y-3">
                        <div className="h-12 w-12 bg-white rounded-[16px] flex items-center justify-center mx-auto text-primary">
                            <Heart className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg">العميل أولاً</h3>
                        <p className="text-sm text-muted-foreground">نجاح عميلنا هو المعيار الوحيد لنجاحنا، ونبني أدواتنا بناءً على احتياجاتهم.</p>
                    </div>
                    <div className="text-center space-y-3">
                        <div className="h-12 w-12 bg-white rounded-[16px] flex items-center justify-center mx-auto text-primary">
                            <Target className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg">البساطة في التعقيد</h3>
                        <p className="text-sm text-muted-foreground">نحول التقنيات المعقدة مثل الذكاء الاصطناعي إلى واجهات بسيطة وسهلة الاستخدام.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
