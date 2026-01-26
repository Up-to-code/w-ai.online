export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 max-w-4xl text-right">
            <h1 className="text-4xl font-black mb-8 text-foreground">سياسة الخصوصية</h1>
            <div className="space-y-8 text-lg text-muted-foreground leading-relaxed">
                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. جمع البيانات</h2>
                    <p>نحن نجمع فقط البيانات الضرورية لتشغيل حسابك وربط متجرك. تشمل هذه البيانات الاسم، البريد الإلكتروني، ومعلومات المتجر الأساسية.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. حماية البيانات</h2>
                    <p>نستخدم أحدث تقنيات التشفير لحماية بياناتك وبيانات عملائك. بيانات محادثات واتساب مشفرة ولا يتم تخزينها لدينا لأغراض غير تشغيلية.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. مشاركة البيانات</h2>
                    <p>نحن لا نبيع أو نؤجر بياناتك لأي طرف ثالث. تتم مشاركة البيانات فقط مع الخدمات المربوطة بطلبك (مثل سلة أو زد) لإتمام العمليات التشغيلية.</p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. الكوكيز</h2>
                    <p>نستخدم ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل أداء المنصة بشكل مجهول.</p>
                </section>
            </div>
        </div>
    )
}
