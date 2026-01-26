export default function RefundPage() {
    return (
        <div className="container mx-auto px-4 max-w-4xl text-right">
            <h1 className="text-4xl font-black mb-8 text-foreground">سياسة الاسترجاع</h1>
            <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. الفترة التجريبية</h2>
                    <p>نوفر فترة تجريبية مجانية لمدة 14 يوماً لاستكشاف كافة مميزات المنصة. لا يتم تحصيل أي مبالغ خلال هذه الفترة.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. سياسة الإلغاء</h2>
                    <p>يمكنك إلغاء اشتراكك في أي وقت من خلال لوحة التحكم. عند الإلغاء، سيظل حسابك نشطاً حتى نهاية الفترة المدفوعة الحالية.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. المبالغ المستردة</h2>
                    <p>نظراً لطبيعة الخدمة الرقمية، فإن المبالغ المدفوعة غير قابلة للاسترداد بعد تفعيل الاشتراك المدفوع. ومع ذلك، نقوم بدراسة الحالات الفنية الاستثنائية التي قد تمنع المستخدم من الاستفادة من الخدمة.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. تجديد الاشتراك</h2>
                    <p>تتجدد الاشتراكات تلقائياً ما لم يتم الإلغاء قبل تاريخ التجديد بـ 24 ساعة على الأقل.</p>
                </section>
            </div>
        </div>
    )
}
