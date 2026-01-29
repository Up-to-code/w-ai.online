"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery";
import { api } from "@convex/_generated/api";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
    Bot,
    Save,
    RefreshCw,
    Play,
    Zap,
    Cpu,
    Terminal,
    Power
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// CONSTANTS
// ============================================
const MODELS = [
    {
        id: "arcee-ai/trinity-mini:free",
        name: "Trinity Mini (Free)",
        provider: "Arcee",
        description: "سريع وخفيف، مثالي للمهام البسيطة والردود السريعة."
    },
    {
        id: "openai/gpt-4o-mini",
        name: "GPT-4o Mini",
        provider: "OpenAI",
        description: "توازن رائع بين الذكاء والسرعة والتكلفة."
    },
    {
        id: "google/gemini-2.0-flash-lite-preview-02-05:free",
        name: "Gemini 2.0 Flash Lite (Free)",
        provider: "Google",
        description: "نموذج سريع ومجاني من Google."
    },
] as const;

// ============================================
// SUB-COMPONENTS
// ============================================
const LoadingSpinner = () => (
    <div className="h-[50vh] flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-50" />
    </div>
);

// ============================================
// TEST PLAYGROUND
// ============================================
const TestPlayground = ({ systemPrompt, languageRules, model }: { systemPrompt: string; languageRules: string; model: string }) => {
    const testAgent = useAction(api.agent.testResponse);
    const [input, setInput] = useState("");
    const [history, setHistory] = useState<{ role: string, content: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput("");
        setHistory(prev => [...prev, { role: "user", content: msg }]);
        setLoading(true);

        try {
            const res = await testAgent({
                message: msg,
                systemPrompt,
                languageRules, // Pass language rules to test agent
                model
            });
            setHistory(prev => [...prev, { role: "assistant", content: res }]);
        } catch (e) {
            toast.error("Test failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="h-[500px] flex flex-col rounded-[24px] border border-border/50">
            <CardHeader className="border-b px-6 py-4">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Play className="h-4 w-4 text-primary" />
                    محاكي المحادثة (Test Lab)
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {history.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs mt-20">
                        ابدأ تجربة الوكيل للتأكد من استجابته للتعليمات الجديدة.
                    </div>
                )}
                {history.map((m, i) => (
                    <div key={i} className={cn("p-3 rounded-xl text-sm max-w-[85%]", m.role === 'user' ? "bg-primary text-primary-foreground mr-auto" : "bg-white border ml-auto")}>
                        {m.content}
                    </div>
                ))}
                {loading && <div className="text-xs text-muted-foreground animate-pulse mr-auto">جارٍ الكتابة...</div>}
            </CardContent>
            <div className="p-3 border-t bg-background rounded-b-[24px] flex gap-2">
                <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="اكتب رسالة..."
                    className="rounded-[12px]"
                />
                <Button size="icon" onClick={handleSend} disabled={loading} className="rounded-[12px]">
                    <Play className="h-4 w-4 rotate-180" />
                </Button>
            </div>
        </Card>
    );
};

// ============================================
// MAIN PAGE
// ============================================
export default function AiSettingsPage() {
    // Queries
    // @ts-ignore
    const config = useUserQuery(api.ai_config.getConfig, {});
    // @ts-ignore
    const updateConfig = useUserMutation(api.ai_config.updateConfig);
    const tools = useQuery(api.tools.list);

    // State
    const [systemPrompt, setSystemPrompt] = useState("");
    const [languageRules, setLanguageRules] = useState("");
    const [model, setModel] = useState<string>(MODELS[0].id);
    // Local state for toggled tools to allow saving all at once or individually? 
    // Usually toggles should auto-save or be part of form. Let's make them part of handleGlobalSave for simplicity or immediate.
    // User expects "Save Changes" button for the prompt. For tools, maybe immediate? 
    // Let's use local state and save with global save.
    const [activeTools, setActiveTools] = useState<string[]>([]);

    // Sync config
    useEffect(() => {
        if (config) {
            setSystemPrompt(config.systemPrompt || "");
            setLanguageRules(config.languageRules || "");
            setModel(config.model || MODELS[0].id);
            setActiveTools(config.tools || []);
        }
    }, [config]);

    const handleGlobalSave = async () => {
        await updateConfig({
            systemPrompt,
            languageRules,
            model,
            isActive: config?.isActive ?? true, // Maintain toggle state
            activePhoneNumbers: config?.activePhoneNumbers || [],
            tools: activeTools
        });
        toast.success("تم تحديث إعدادات الوكيل");
    };

    const toggleTool = (slug: string, checked: boolean) => {
        setActiveTools(prev =>
            checked
                ? [...prev, slug]
                : prev.filter(t => t !== slug)
        );
    };

    if (config === undefined || tools === undefined) return <LoadingSpinner />;

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-background text-foreground dir-rtl">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl"><Bot className="h-8 w-8 text-primary" /></div>
                        إدارة عقل النظام
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        التحكم الكامل في ذاكرة وسلوك وأدوات الوكيل الذكي.
                    </p>
                </div>
                <Button onClick={handleGlobalSave} size="lg" className="rounded-[16px] font-bold px-8 shadow-lg shadow-primary/20">
                    <Save className="h-5 w-5 ml-2" />
                    حفظ التغييرات
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Right Column: System Brain */}
                <div className="xl:col-span-2 space-y-8">

                    {/* System Prompt */}
                    <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-5 w-5 text-primary" />
                                <CardTitle>الشخصية والتعليمات الأساسية</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea
                                value={systemPrompt}
                                onChange={(e) => setSystemPrompt(e.target.value)}
                                className="min-h-[300px] text-lg leading-relaxed rounded-[24px] border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors p-6 resize-none focus:border-primary focus:ring-0"
                                placeholder="صف هوية الوكيل (مثلاً: أنت موظف استقبال في فندق...).."
                            />
                            <div className="flex justify-between items-center mt-4 text-xs text-muted-foreground font-mono">
                                <span>Tokens approx: {systemPrompt.length / 4}</span>
                                <div>
                                    Model:
                                    <Select value={model} onValueChange={setModel}>
                                        <SelectTrigger className="w-[200px] h-8 ml-2 inline-flex">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Language Rules */}
                    <Card className="rounded-[32px] border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/50 p-6">
                            <div className="flex items-center gap-2">
                                <Terminal className="h-5 w-5 text-indigo-500" />
                                <CardTitle>قواعد اللغة واللهجة (Language Rules)</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Textarea
                                value={languageRules}
                                onChange={(e) => setLanguageRules(e.target.value)}
                                className="min-h-[150px] text-lg leading-relaxed rounded-[24px] border-2 border-dashed border-border/60 hover:border-indigo-500/50 transition-colors p-6 resize-none focus:border-indigo-500 focus:ring-0"
                                placeholder="مثلاً: 'تحدث باللهجة السعودية البيضاء'، 'كن رسمياً جداً'، 'استخدم إيموجي واحد فقط'..."
                            />
                            <p className="text-xs text-muted-foreground mt-3">
                                هذه القواعد تضاف تلقائياً بناءً على لغة المستخدم المكتشفة، ولكن يمكنك إضافة قواعد عامة هنا.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Dynamic Tools Registry */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                سجل الأدوات النشطة (Tool Registry)
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tools?.map((tool: any) => {
                                const isEnabled = activeTools.includes(tool.slug);
                                return (
                                    <div key={tool._id}
                                        className={cn(
                                            "relative bg-card border border-border/50 p-5 rounded-[24px] flex flex-col gap-3 transition-all",
                                            isEnabled ? "ring-2 ring-primary/20 shadow-md bg-accent/5" : "opacity-70 grayscale-[0.5]"
                                        )}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("p-2.5 rounded-xl transition-colors", isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                                                    <Terminal className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-base">{tool.name}</h3>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">{tool.path}</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={isEnabled}
                                                onCheckedChange={(checked) => toggleTool(tool.slug, checked)}
                                            />
                                        </div>

                                        <div className="bg-muted/30 p-3 rounded-xl mt-auto">
                                            <p className="text-[10px] items-center text-muted-foreground line-clamp-3 leading-relaxed">
                                                {tool.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* Left Column: Testing */}
                <div className="xl:col-span-1 space-y-6">
                    <TestPlayground systemPrompt={systemPrompt} languageRules={languageRules} model={model} />

                    <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 rounded-[24px]">
                        <CardHeader>
                            <CardTitle className="text-blue-700 dark:text-blue-300 text-sm">كيف يعمل؟</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs text-blue-600/80 dark:text-blue-400 leading-relaxed">
                            تفعيل الأداة يمنح الذكاء الاصطناعي القدرة على استخدامها وفهم تعليماتها.
                            <br /><br />
                            التعليمات "محفورة" في النظام لضمان أفضل أداء (System Code)، يمكنك فقط تفعيل/تعطيل الأدوات حسب الحاجة.
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div >
    );
}