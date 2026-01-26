"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery";
import { useAction, useMutation } from "convex/react";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
    Bot,
    Save,
    RefreshCw,
    Play,
    MessageSquare,
    Plus,
    Trash2,
    Brain,
    Cpu,
    Settings2,
    Zap,
    Search,
    BookOpen,
    ShoppingBag,
    Users,
} from "lucide-react";
import { logger } from "@/lib/logger";
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
        id: "openai/gpt-4o",
        name: "GPT-4o (Premium)",
        provider: "OpenAI",
        description: "الأقوى والأذكى، يتفوق في المهام المعقدة والمنطق."
    },
    {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        description: "يمتاز بأسلوب كتابة طبيعي جداً وقدرات برمجية عالية."
    },
] as const;

const AI_TOOLS = [
    {
        id: 'salla',
        name: 'البحث في سلة',
        desc: 'يستطيع الوكيل عرض منتجاتك من سلة مباشرة.',
        icon: ShoppingBag
    },
    {
        id: 'handoff',
        name: 'التحويل للموظف',
        desc: 'إسناد المحادثة للموظف عند طلب العميل.',
        icon: Users
    },
    {
        id: 'media',
        name: 'إرسال الوسائط',
        desc: 'إرسال صور وفيديوهات توضيحية للمنتجات.',
        icon: Play
    },
    {
        id: 'orders',
        name: 'تتبع الطلبات',
        desc: 'الإجابة على حالة طلبات العملاء تلقائياً.',
        icon: Search
    },
] as const;

const MAX_PROMPT_LENGTH = 5000;
const MAX_KB_TITLE_LENGTH = 100;
const MAX_KB_CONTENT_LENGTH = 2000;
const MAX_TEST_MESSAGE_LENGTH = 500;

// ============================================
// VALIDATION UTILITIES
// ============================================
const validatePrompt = (prompt: string): string | null => {
    if (!prompt.trim()) return "التعليمات لا يمكن أن تكون فارغة";
    if (prompt.length > MAX_PROMPT_LENGTH) return `التعليمات طويلة جداً (الحد الأقصى ${MAX_PROMPT_LENGTH} حرف)`;
    return null;
};

const validateKnowledgeBase = (title: string, content: string): string | null => {
    if (!title.trim() || !content.trim()) return "الرجاء ملء جميع الحقول";
    if (title.length > MAX_KB_TITLE_LENGTH) return `العنوان طويل جداً (الحد الأقصى ${MAX_KB_TITLE_LENGTH} حرف)`;
    if (content.length > MAX_KB_CONTENT_LENGTH) return `المحتوى طويل جداً (الحد الأقصى ${MAX_KB_CONTENT_LENGTH} حرف)`;
    return null;
};

const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, '');
};

// ============================================
// SUB-COMPONENTS
// ============================================
const LoadingSpinner = () => {
    return (
        <div className="h-[80vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <RefreshCw className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-sm font-black text-muted-foreground animate-pulse uppercase tracking-[0.2em]">
                    جارٍ التحميل...
                </p>
            </div>
        </div>
    );
};

const StatusIndicator = ({ isActive }: { isActive: boolean }) => {
    return (
        <div className="flex items-center gap-4 bg-muted/30 border border-border/50 p-1.5 rounded-[12px]">
            <div className="flex items-center gap-2 px-3 py-1.5">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    isActive ? "bg-success" : "bg-slate-300"
                )} />
                <span className="text-xs font-bold">
                    {isActive ? "نشط" : "غير نشط"}
                </span>
            </div>
            <div className="h-10 w-[1px] bg-border/50" />
        </div>
    );
};

// ============================================
// KNOWLEDGE BASE DIALOG
// ============================================
const KnowledgeBaseDialog = ({
    isOpen,
    onClose,
    onSave
}: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, content: string) => Promise<void>;
}) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = useCallback(async () => {
        const error = validateKnowledgeBase(title, content);
        if (error) {
            toast.error(error);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(sanitizeInput(title), sanitizeInput(content));
            setTitle("");
            setContent("");
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    }, [title, content, onSave, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="rounded-[32px] max-w-lg p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-0">
                    <DialogTitle className="text-2xl font-black">
                        إضافة معلومة جديدة
                    </DialogTitle>
                    <DialogDescription className="font-medium pt-1">
                        أضف معلومات محددة عن عملك ليستخدمها الوكيل في الرد على العملاء.
                    </DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest mr-1">
                            العنوان
                        </Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: ساعات العمل"
                            className="h-12 rounded-[14px] font-bold border-2"
                            maxLength={MAX_KB_TITLE_LENGTH}
                            aria-label="العنوان"
                        />
                        <p className="text-xs text-muted-foreground">
                            {title.length}/{MAX_KB_TITLE_LENGTH}
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest mr-1">
                            المحتوى
                        </Label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            placeholder="مثال: نعمل من الأحد إلى الخميس، من الساعة 9 صباحًا حتى 5 مساءً."
                            className="rounded-[18px] font-bold border-2 p-4 resize-none"
                            dir="auto"
                            maxLength={MAX_KB_CONTENT_LENGTH}
                            aria-label="المحتوى"
                        />
                        <p className="text-xs text-muted-foreground">
                            {content.length}/{MAX_KB_CONTENT_LENGTH}
                        </p>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-[18px] text-lg font-black shadow-none active:scale-95 transition-all"
                    >
                        {isSubmitting ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                            "إضافة"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// ============================================
// TEST PLAYGROUND
// ============================================
const TestPlayground = ({
    systemPrompt,
    model
}: {
    systemPrompt: string;
    model: string;
}) => {
    const testAgent = useAction(api.agent.testResponse);
    const [testMessage, setTestMessage] = useState("");
    const [testMessages, setTestMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const handleTest = useCallback(async () => {
        const sanitized = sanitizeInput(testMessage);
        if (!sanitized || sanitized.length > MAX_TEST_MESSAGE_LENGTH) {
            toast.error(`Message must be between 1 and ${MAX_TEST_MESSAGE_LENGTH} characters`);
            return;
        }

        const newUserMsg = { role: 'user' as const, content: sanitized };
        setTestMessages(prev => [...prev, newUserMsg]);
        setTestMessage("");
        setIsTesting(true);

        try {
            const response = await testAgent({
                message: sanitized,
                systemPrompt: systemPrompt,
                model: model,
            });
            setTestMessages(prev => [...prev, { role: 'assistant' as const, content: response }]);
        } catch (error) {
            logger.error("Test agent failed:", error);
            toast.error("Test failed");
            setTestMessages(prev => [
                ...prev,
                {
                    role: 'assistant' as const,
                    content: "⚠️ Connection error. Check settings."
                }
            ]);
        } finally {
            setIsTesting(false);
        }
    }, [testMessage, systemPrompt, model, testAgent]);

    return (
        <Card className="border border-border/60 rounded-[16px] overflow-hidden shadow-none bg-card flex flex-col h-[400px]">
            <CardHeader className="p-4 border-b border-border/40 bg-muted/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Play className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm font-bold">
                            ساحة اختبار
                        </CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTestMessages([])}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        aria-label="Clear chat"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-4 flex flex-col gap-3 overflow-hidden bg-muted/5">
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar" role="log" aria-live="polite">
                    {testMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                            <MessageSquare className="h-8 w-8 mb-2" />
                            <p className="text-xs">
                                ابدأ المحادثة مع الوكيل لاختبار استجابته.
                            </p>
                        </div>
                    ) : (
                        testMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "flex flex-col max-w-[85%] text-xs p-3 rounded-[12px]",
                                    msg.role === 'user'
                                        ? "self-end bg-primary text-primary-foreground rounded-tr-none"
                                        : "self-start bg-background border border-border/50 rounded-tl-none"
                                )}
                            >
                                {msg.content}
                            </div>
                        ))
                    )}
                    {isTesting && (
                        <div className="self-start bg-background border border-border/50 p-2 rounded-[12px] rounded-tl-none">
                            <RefreshCw className="h-3 w-3 animate-spin opacity-50" />
                        </div>
                    )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border/30">
                    <Input
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleTest()}
                        placeholder="اكتب رسالة اختبار..."
                        className="flex-1 h-9 rounded-[8px] border-border/50 text-xs bg-background"
                        maxLength={MAX_TEST_MESSAGE_LENGTH}
                        disabled={isTesting}
                        aria-label="Test message"
                    />
                    <Button
                        onClick={handleTest}
                        disabled={isTesting || !testMessage.trim()}
                        size="icon"
                        className="h-9 w-9 rounded-[8px]"
                        aria-label="Send"
                    >
                        <div className="rotate-180">
                            <Play className="h-3 w-3" />
                        </div>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
export default function AiSettingsPage() {
    const config = useUserQuery(api.ai_config.getConfig, {});
    const updateConfig = useUserMutation(api.ai_config.updateConfig);
    const webhookConfigs = useUserQuery(api.webhooks.listWebhooks, {});
    const knowledgeBase = useUserQuery(api.ai.listKnowledge, {});
    const saveKnowledge = useMutation(api.ai.saveKnowledge);
    const deleteKnowledge = useMutation(api.ai.deleteKnowledge);

    const [systemPrompt, setSystemPrompt] = useState("");
    const [model, setModel] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [tools, setTools] = useState<string[]>([]);
    const [activePhoneNumbers, setActivePhoneNumbers] = useState<string[]>([]);
    const [hasChanged, setHasChanged] = useState(false);
    const [isAddingKb, setIsAddingKb] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize form
    useEffect(() => {
        if (config) {
            setSystemPrompt(config.systemPrompt || "");
            setModel(config.model || MODELS[0].id);
            setIsActive(config.isActive ?? false);
            setTools(config.tools || []);
            setActivePhoneNumbers(config.activePhoneNumbers || []);
        }
    }, [config]);

    const selectedModelInfo = useMemo(
        () => MODELS.find(m => m.id === model) || MODELS[0],
        [model]
    );

    const handleSave = useCallback(async () => {
        const error = validatePrompt(systemPrompt);
        if (error) {
            toast.error(error);
            return;
        }

        setIsSaving(true);
        try {
            await updateConfig({
                systemPrompt: sanitizeInput(systemPrompt),
                model,
                isActive,
                tools,
                activePhoneNumbers,
            });
            setHasChanged(false);
            toast.success("تم حفظ إعدادات الذكاء الاصطناعي بنجاح");
        } catch (error) {
            toast.error("فشل في حفظ الإعدادات");
            logger.error("Failed to save AI config:", error);
        } finally {
            setIsSaving(false);
        }
    }, [systemPrompt, model, isActive, tools, activePhoneNumbers, updateConfig]);

    const handleAddKb = useCallback(async (title: string, content: string) => {
        await saveKnowledge({ title, content });
        toast.success("تمت إضافة المعلومات للقاعدة المعرفية");
    }, [saveKnowledge]);

    const handleDeleteKb = useCallback(async (id: string) => {
        try {
            await deleteKnowledge({ id });
            toast.success("تم حذف المعلومة");
        } catch (error) {
            toast.error("فشل حذف المعلومة");
            logger.error("KB delete failed:", error);
        }
    }, [deleteKnowledge]);

    const toggleTool = useCallback((id: string) => {
        setTools(prev =>
            prev.includes(id)
                ? prev.filter(t => t !== id)
                : [...prev, id]
        );
        setHasChanged(true);
    }, []);

    const togglePhoneNumber = useCallback((id: string) => {
        setActivePhoneNumbers(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
        setHasChanged(true);
    }, []);

    if (config === undefined) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-6 sm:p-10 space-y-10 bg-background min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2.5 rounded-[12px]">
                            <Bot className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            إعدادات الوكيل الذكي
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <StatusIndicator isActive={isActive} />
                    <div className="px-2">
                        <Switch
                            checked={isActive}
                            onCheckedChange={(val) => {
                                setIsActive(val);
                                setHasChanged(true);
                            }}
                            className="data-[state=checked]:bg-success"
                            aria-label="تفعيل الوكيل الذكي"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* System Instructions */}
                    <Card className="border border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-primary/5 rounded-[12px] text-primary">
                                            <Cpu className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-2xl font-black">
                                            تعليمات النظام
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-muted-foreground font-medium">
                                        حدد كيف يجب أن يتصرف الوكيل الذكي ويستجيب لرسائل العملاء.
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={handleSave}
                                    disabled={!hasChanged || isSaving}
                                    className="h-11 px-8 rounded-[16px] font-black gap-2 relative group overflow-hidden"
                                >
                                    {isSaving ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            حفظ الإعدادات
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="relative group">
                                <Textarea
                                    value={systemPrompt}
                                    onChange={(e) => {
                                        setSystemPrompt(e.target.value);
                                        setHasChanged(true);
                                    }}
                                    className="min-h-[350px] text-lg rounded-[24px] border-2 border-border/50 font-medium leading-relaxed p-6 resize-none focus:border-primary/30 transition-all bg-muted/5 group-hover:bg-background"
                                    placeholder="مثال: أنت وكيل خدمة عملاء ودود ومفيد لمتجر إلكتروني يبيع منتجات يدوية."
                                    dir="auto"
                                    maxLength={MAX_PROMPT_LENGTH}
                                    aria-label="تعليمات النظام"
                                />
                                <div className="absolute top-4 left-4">
                                    <Settings2 className="h-5 w-5 text-muted-foreground/30" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {systemPrompt.length}/{MAX_PROMPT_LENGTH}
                            </p>

                            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-muted/30 p-4 rounded-[20px] space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                        المتغيرات المتاحة
                                    </p>
                                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                                        <span className="text-primary mt-1">{"{{customer_name}}"}</span>
                                        <span className="text-primary mt-1">{"{{order_info}}"}</span>
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-[20px] space-y-1 md:col-span-2">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                                        نصائح
                                    </p>
                                    <p className="text-[11px] font-bold text-muted-foreground">
                                        استخدم لغة واضحة وموجزة. كن محددًا بشأن الدور والسلوك.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Knowledge Base */}
                    <Card className="border border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-info/5 rounded-[12px] text-info">
                                            <Brain className="h-5 w-5" />
                                        </div>
                                        <CardTitle className="text-2xl font-black">
                                            القاعدة المعرفية
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-muted-foreground font-medium">
                                        أضف معلومات محددة عن عملك ليستخدمها الوكيل في الرد على العملاء.
                                    </CardDescription>
                                </div>

                                <Button
                                    variant="outline"
                                    className="h-11 rounded-[16px] border-2 font-black gap-2 hover:bg-muted/50"
                                    onClick={() => setIsAddingKb(true)}
                                >
                                    <Plus className="h-4 w-4" />
                                    إضافة معلومة
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                {knowledgeBase && knowledgeBase.length > 0 ? (
                                    knowledgeBase.map((kb: any) => (
                                        <div
                                            key={kb._id}
                                            className="flex items-start gap-4 p-5 rounded-[24px] border border-border/40 group hover:border-primary/20 hover:bg-primary/5 transition-all"
                                        >
                                            <div className="p-3 bg-muted group-hover:bg-white rounded-[16px] text-muted-foreground group-hover:text-primary transition-all">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-foreground mb-1">
                                                    {kb.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground font-medium line-clamp-2 leading-relaxed">
                                                    {kb.content}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteKb(kb._id)}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-[12px]"
                                                aria-label="حذف المعلومة"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12 bg-muted/20 rounded-[28px] border-2 border-dashed border-border/50">
                                        <div className="bg-white p-4 rounded-[20px] inline-block mb-4 shadow-sm">
                                            <Search className="h-8 w-8 text-slate-200" />
                                        </div>
                                        <p className="text-muted-foreground font-black uppercase tracking-[0.2em] text-xs">
                                            لا توجد معلومات في القاعدة المعرفية حتى الآن.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* AI Tools */}
                    <Card className="border border-border/50 rounded-[32px] overflow-hidden shadow-none">
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-success/5 rounded-[12px] text-success">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <CardTitle className="text-2xl font-black">
                                    أدوات الذكاء الاصطناعي
                                </CardTitle>
                            </div>
                            <CardDescription className="text-muted-foreground font-medium">
                                قم بتمكين الأدوات التي يمكن للوكيل الذكي استخدامها لأداء مهام محددة.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AI_TOOLS.map((tool) => (
                                <div
                                    key={tool.id}
                                    className="flex items-center justify-between p-5 rounded-[24px] border border-border/40 bg-muted/5 group hover:bg-white transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-[16px] group-hover:bg-primary/5 group-hover:text-primary transition-all">
                                            <tool.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm">
                                                {tool.id === 'salla' && 'البحث في سلة'}
                                                {tool.id === 'handoff' && 'التحويل للموظف'}
                                                {tool.id === 'media' && 'إرسال الوسائط'}
                                                {tool.id === 'orders' && 'تتبع الطلبات'}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground font-bold">
                                                {tool.id === 'salla' && 'يستطيع الوكيل عرض منتجاتك من سلة مباشرة.'}
                                                {tool.id === 'handoff' && 'إسناد المحادثة للموظف عند طلب العميل.'}
                                                {tool.id === 'media' && 'إرسال صور وفيديوهات توضيحية للمنتجات.'}
                                                {tool.id === 'orders' && 'الإجابة على حالة طلبات العملاء تلقائياً.'}
                                            </p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={tools.includes(tool.id)}
                                        onCheckedChange={() => toggleTool(tool.id)}
                                        className="data-[state=checked]:bg-success"
                                        aria-label={`Enable ${tool.name}`}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-6">
                    {/* WhatsApp Numbers */}
                    <Card className="border border-border/60 rounded-[16px] overflow-hidden shadow-none bg-card">
                        <CardHeader className="p-6 pb-4">
                            <CardTitle className="text-lg font-bold">
                                أرقام واتساب
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-3">
                            {webhookConfigs && webhookConfigs.length > 0 ? (
                                webhookConfigs.map((wh: any) => (
                                    <div
                                        key={wh._id}
                                        className="flex items-center justify-between p-3 rounded-[12px] bg-muted/30 border border-border/40"
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-semibold">
                                                {wh.name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-mono">
                                                {wh.phoneNumbers?.[0]?.phoneNumberId || "ID: ---"}
                                            </span>
                                        </div>
                                        <Switch
                                            checked={activePhoneNumbers.includes(wh.phoneNumbers?.[0]?.phoneNumberId)}
                                            onCheckedChange={() => togglePhoneNumber(wh.phoneNumbers?.[0]?.phoneNumberId)}
                                            aria-label={`Active ${wh.name}`}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">
                                    No numbers
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Model Selector */}
                    <Card className="border border-border/60 rounded-[16px] overflow-hidden shadow-none bg-card">
                        <CardHeader className="p-6 pb-4">
                            <CardTitle className="text-lg font-bold">
                                نماذج الذكاء الاصطناعي
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <Select
                                value={model}
                                onValueChange={(val) => {
                                    setModel(val);
                                    setHasChanged(true);
                                }}
                            >
                                <SelectTrigger className="rounded-[12px] h-11" aria-label="Select Model">
                                    <SelectValue placeholder="اختر نموذجاً" />
                                </SelectTrigger>
                                <SelectContent className="rounded-[12px]">
                                    {MODELS.map(m => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <span className="font-medium">{m.name}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="bg-muted/30 p-4 rounded-[12px] border border-border/30">
                                <p className="text-xs text-muted-foreground/80 leading-relaxed">
                                    {selectedModelInfo.description}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test Playground */}
                    <TestPlayground systemPrompt={systemPrompt} model={model} />
                </div>
            </div>

            {/* Knowledge Base Dialog */}
            <KnowledgeBaseDialog
                isOpen={isAddingKb}
                onClose={() => setIsAddingKb(false)}
                onSave={handleAddKb}
            />

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(100, 116, 139, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(100, 116, 139, 0.5);
                }
            `}</style>
        </div>
    );
}