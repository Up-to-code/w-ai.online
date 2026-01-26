"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAction, useMutation } from "convex/react"
import { useUserQuery, useUserMutation } from "@/hooks/useUserQuery"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    ArrowRight,
    LayoutTemplate,
    FileText,
    Image as ImageIcon,
    Video,
    Type,
    MousePointerClick,
    Plus,
    X,
    CheckCircle2,
    Smartphone,
    Link2,
    Phone,
    AlertCircle,
    Copy,
    ShoppingBag,
    Layers,
    Upload,
    Loader2,
    Variable
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

import { ProductPicker } from "../../chat/_components/ProductPicker"

interface CarouselCard {
    headerType: "IMAGE" | "VIDEO"
    headerHandle?: string // Meta Handle
    headerUrl?: string // Preview URL
    bodyText: string
    buttons: ButtonConfig[]
}

interface ProductCarouselCard {
    productId: string // Catalog product ID
    bodyText?: string // Optional custom body
    buttonType: "VIEW" | "URL"
    buttonUrl?: string // For URL buttons
}

interface ButtonConfig {
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE" | "CATALOG"
    text: string
    url?: string
    phone_number?: string
    example?: string // For COPY_CODE
}

export default function NewTemplatePage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editName = searchParams?.get("edit")

    const { userId } = useUserContext();
    const { currentOrganization } = useOrganizationContext();
    const createTemplate = useAction(api.templates.createTemplate)
    const existingTemplate = useUserQuery(api.templates.getByName, editName ? { name: editName } : {}, { enabled: !!editName })
    const uploadTemplateMedia = useAction(api.whatsapp.uploadTemplateMedia)
    const uploadExternalMedia = useAction(api.whatsapp.uploadExternalTemplateMedia)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [uploadingMedia, setUploadingMedia] = useState(false)

    // Salla Connection Status
    const sallaConnection = useUserQuery(api.salla.getConnection, { organizationId: currentOrganization?._id });
    const isEcomConnected = !!sallaConnection;

    // Form State
    const [name, setName] = useState("")
    const [category, setCategory] = useState("MARKETING")
    const [language, setLanguage] = useState("ar")
    const [templateType, setTemplateType] = useState<"STANDARD" | "CAROUSEL" | "PRODUCT_CAROUSEL" | "CATALOG">("STANDARD")

    // Meta Logic: Authentication templates cannot have headers
    useEffect(() => {
        if (category === "AUTHENTICATION") {
            setHeaderType("NONE")
        }
    }, [category])

    // Standard Components State
    const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO">("NONE")
    const [headerText, setHeaderText] = useState("")
    const [headerVariables, setHeaderVariables] = useState<string[]>([])
    const [headerVariableSamples, setHeaderVariableSamples] = useState<Record<string, string>>({})
    const [headerHandle, setHeaderHandle] = useState("")
    const [headerPreviewUrl, setHeaderPreviewUrl] = useState("")

    const [bodyText, setBodyText] = useState("")
    const [bodyVariables, setBodyVariables] = useState<string[]>([])
    const [bodyVariableSamples, setBodyVariableSamples] = useState<Record<string, string>>({})
    const [footerText, setFooterText] = useState("")
    const [buttons, setButtons] = useState<ButtonConfig[]>([])

    // Carousel State
    const [carouselHeaderType, setCarouselHeaderType] = useState<"IMAGE" | "VIDEO">("IMAGE")
    const [carouselCards, setCarouselCards] = useState<CarouselCard[]>([
        { headerType: "IMAGE", bodyText: "", buttons: [{ type: "URL", text: "View Details", url: "https://example.com" }] },
        { headerType: "IMAGE", bodyText: "", buttons: [{ type: "URL", text: "View Details", url: "https://example.com" }] }
    ])

    // Product Carousel State
    const [productCarouselCards, setProductCarouselCards] = useState<ProductCarouselCard[]>([])
    const [catalogId, setCatalogId] = useState<string>("") // Meta Catalog ID

    // Catalog Template State
    const [catalogHeaderHandle, setCatalogHeaderHandle] = useState("")
    const [catalogHeaderPreviewUrl, setCatalogHeaderPreviewUrl] = useState("")
    const [catalogBodyText, setCatalogBodyText] = useState("")

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [activeUploadField, setActiveUploadField] = useState<"HEADER" | number | null>(null) // HEADER or Card Index

    // Pre-fill form if editing
    useEffect(() => {
        if (existingTemplate && !name) { // Only fill once
            setName(existingTemplate.name + "_copy") // Suggest new name
            setCategory(existingTemplate.category)
            setLanguage(existingTemplate.language)

            const components = existingTemplate.components || []

            // Detect Type
            const carousel = components.find((c: any) => c.type === "CAROUSEL")
            if (carousel) {
                setTemplateType("CAROUSEL")
                // TODO: Parse carousel cards
            } else {
                setTemplateType("STANDARD")
                // Header
                const header = components.find((c: any) => c.type === "HEADER")
                if (header) {
                    setHeaderType(header.format)
                    if (header.format === "TEXT") setHeaderText(header.text || "")
                    // Note: Handles are not usually retrievable for editing, need re-upload
                }

                // Body
                const body = components.find((c: any) => c.type === "BODY")
                if (body) setBodyText(body.text || "")

                // Footer
                const footer = components.find((c: any) => c.type === "FOOTER")
                if (footer) setFooterText(footer.text || "")

                // Buttons
                const btns = components.find((c: any) => c.type === "BUTTONS")
                if (btns && btns.buttons) {
                    setButtons(btns.buttons.map((b: any) => ({
                        type: b.type,
                        text: b.text,
                        url: b.url,
                        phone_number: b.phone_number,
                        example: b.example
                    })))
                }
            }
        }
    }, [existingTemplate])

    // Extract variables from header text
    useEffect(() => {
        if (headerType === "TEXT") {
            const matches = Array.from(headerText.matchAll(/{{(\d+)}}/g)).map(m => m[1]);
            const uniqueVars = Array.from(new Set(matches)).sort((a, b) => Number(a) - Number(b));
            setHeaderVariables(uniqueVars);
        } else {
            setHeaderVariables([]);
        }
    }, [headerText, headerType]);

    // Extract variables from body text
    useEffect(() => {
        const matches = Array.from(bodyText.matchAll(/{{(\d+)}}/g)).map(m => m[1]);
        const uniqueVars = Array.from(new Set(matches)).sort((a, b) => Number(a) - Number(b));
        setBodyVariables(uniqueVars);
    }, [bodyText]);

    // --- Media Upload Logic ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Meta Logic: File Type and Size validation
        const isVideo = file.type.startsWith("video/")
        const maxVideoSize = 16 * 1024 * 1024 // 16MB for templates

        if (isVideo) {
            if (!["video/mp4", "video/quicktime"].includes(file.type)) {
                alert("صيغة الفيديو غير مدعومة. يرجى استخدام MP4 أو MOV.")
                return
            }
            if (file.size > maxVideoSize) {
                alert("حجم الفيديو كبير جداً. الحد الأقصى لقوالب Meta هو 16 ميجابايت.")
                return
            }
        }

        setUploadingMedia(true)
        try {
            // 1. Upload to Convex Storage first (to get a URL for the server to read)
            const postUrl = await generateUploadUrl()
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            })
            const { storageId } = await result.json()

            // 2. Upload to Meta via Server Action
            if (!currentOrganization?._id) throw new Error("Organization not selected");
            const handle = await uploadTemplateMedia({
                organizationId: currentOrganization._id,
                storageId,
                type: file.type
            })

            const previewUrl = URL.createObjectURL(file)

            if (activeUploadField === "HEADER") {
                if (templateType === "CATALOG") {
                    setCatalogHeaderHandle(handle)
                    setCatalogHeaderPreviewUrl(previewUrl)
                } else {
                    setHeaderHandle(handle)
                    setHeaderPreviewUrl(previewUrl)
                }
            } else if (typeof activeUploadField === "number") {
                // Update Carousel Card
                const newCards = [...carouselCards]
                newCards[activeUploadField].headerHandle = handle
                newCards[activeUploadField].headerUrl = previewUrl
                setCarouselCards(newCards)
            }

        } catch (error) {
            logger.error("Upload failed:", error)
            alert("فشل رفع الملف. تأكد من إعدادات Meta.")
        } finally {
            setUploadingMedia(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const triggerUpload = (field: "HEADER" | number) => {
        setActiveUploadField(field)
        fileInputRef.current?.click()
    }

    const handleSallaProductSelect = async (product: any, field: "HEADER" | number) => {
        if (!product.image) {
            alert("هذا المنتج لا يحتوي على صورة")
            return
        }

        setUploadingMedia(true)
        try {
            // 1. Update Preview Immediately
            if (field === "HEADER") {
                setHeaderType("IMAGE")
                setHeaderPreviewUrl(product.image)
                if (!bodyText) setBodyText(`${product.name}\n${product.price} ${product.currency}`)
            } else if (typeof field === "number") {
                if (carouselHeaderType !== "IMAGE") {
                    setCarouselHeaderType("IMAGE")
                    const newCards = carouselCards.map(c => ({ ...c, headerType: "IMAGE" as const }))
                    setCarouselCards(newCards)
                }

                const newCards = [...carouselCards]
                newCards[field].headerUrl = product.image
                newCards[field].bodyText = `${product.name}\n${product.price} ${product.currency}`
                setCarouselCards(newCards)
            }

            // 2. Upload to Meta (Backend handles fetch -> upload)
            if (!currentOrganization?._id) throw new Error("Organization not selected");
            const handle = await uploadExternalMedia({
                organizationId: currentOrganization._id,
                url: product.image,
                type: "image/jpeg" // Salla images are usually JPEGs/PNGs
            })

            // 3. Update Handle
            if (field === "HEADER") {
                setHeaderHandle(handle)
            } else if (typeof field === "number") {
                const newCards = [...carouselCards]
                newCards[field].headerHandle = handle
                // Re-update body/url just in case (though already done)
                newCards[field].headerUrl = product.image
                newCards[field].bodyText = `${product.name}\n${product.price} ${product.currency}`

                // Add button if missing or update URL
                if (product.url) {
                    const hasUrlBtn = newCards[field].buttons.some(b => b.type === "URL")
                    if (!hasUrlBtn) {
                        // Check if we can add a button (limit 2 usually for mixed, or just 3)
                        if (newCards[field].buttons.length < 2) {
                            newCards[field].buttons.push({
                                type: "URL",
                                text: "عرض المنتج",
                                url: product.url
                            })
                        }
                    } else {
                        // Update existing URL button? Maybe safer to leave user choice, 
                        // but let's try to update empty ones
                        newCards[field].buttons = newCards[field].buttons.map(b =>
                            b.type === "URL" && (!b.url || b.url === "https://example.com")
                                ? { ...b, url: product.url, text: b.text === "View Details" ? "عرض المنتج" : b.text }
                                : b
                        )
                    }
                }

                setCarouselCards(newCards)
            }

        } catch (error) {
            logger.error("Salla import failed:", error)
            alert("فشل استيراد الصورة من سلة. " + String(error))
        } finally {
            setUploadingMedia(false)
        }
    }

    // --- Button Logic ---
    const handleAddButton = (type: ButtonConfig["type"], targetCards?: boolean, cardIndex?: number) => {
        if (targetCards) {
            // For Carousel: All cards must have same button structure
            // We update the schema for ALL cards
            const newCards = carouselCards.map(card => ({
                ...card,
                buttons: [...card.buttons, { type, text: "", url: "", phone_number: "" }]
            }))
            setCarouselCards(newCards)
        } else {
            if (buttons.length >= 3) return
            // Meta Logic: Auth templates usually have 1 button (Copy Code)
            if (category === "AUTHENTICATION" && buttons.length >= 1) {
                alert("قوالب التوثيق تدعم زر واحد فقط (Copy Code).")
                return
            }

            const buttonType = category === "AUTHENTICATION" ? "COPY_CODE" : type;
            setButtons([...buttons, { type: buttonType, text: category === "AUTHENTICATION" ? "نسخ الكود" : "", url: "", phone_number: "" }])
        }
    }

    const handleRemoveButton = (index: number, targetCards?: boolean) => {
        if (targetCards) {
            const newCards = carouselCards.map(card => ({
                ...card,
                buttons: card.buttons.filter((_, i) => i !== index)
            }))
            setCarouselCards(newCards)
        } else {
            setButtons(buttons.filter((_, i) => i !== index))
        }
    }

    const handleButtonChange = (index: number, field: string, value: string, targetCards?: boolean) => {
        if (targetCards) {
            // Updates validation/schema, but text might be unique per card? 
            // NO, Meta Carousel buttons must be SAME type, but text can be different?
            // Actually for Quick Replies yes. For URL/Phone, usually same type.
            // Meta Rule: "The buttons in each card must be the same type and in the same order."
            // "Button parameters (text, url, payload) can be different."
            // So we update ALL cards if it's type change. If text change, only that card?
            // To simplify UI: We will define the Button Structure globally for the carousel, 
            // and allow editing text per card.
            // WAIT: This is getting complex.
            // Let's implement: "Global Button Definition" for Carousel.
            // Actually, let's keep it simple: 
            // Update logic: if changing TYPE, change for all. If changing text, change for all (template default).
            // User can override text in specific card if needed? 
            // For now, let's assume buttons are identical across cards for simplicity, 
            // as most catalogs work that way.

            const newCards = carouselCards.map(card => {
                const newBtns = [...card.buttons]
                newBtns[index] = { ...newBtns[index], [field]: value }
                return { ...card, buttons: newBtns }
            })
            setCarouselCards(newCards)
        } else {
            const newButtons = [...buttons]
            newButtons[index] = { ...newButtons[index], [field]: value }
            setButtons(newButtons)
        }
    }

    // --- Carousel Logic ---
    const handleCarouselTypeChange = (type: "IMAGE" | "VIDEO") => {
        setCarouselHeaderType(type)
        const newCards = carouselCards.map(card => ({ ...card, headerType: type }))
        setCarouselCards(newCards)
    }

    const addCard = () => {
        if (carouselCards.length >= 10) return
        // Copy structure of first card
        const templateCard = carouselCards[0]
        setCarouselCards([...carouselCards, {
            headerType: carouselHeaderType,
            bodyText: "",
            buttons: templateCard.buttons.map(b => ({ ...b, text: b.text }))
        }])
    }

    const removeCard = (index: number) => {
        if (carouselCards.length <= 1) return
        setCarouselCards(carouselCards.filter((_, i) => i !== index))
    }

    const updateCard = (index: number, field: keyof CarouselCard, value: any) => {
        const newCards = [...carouselCards]
        newCards[index] = { ...newCards[index], [field]: value }
        setCarouselCards(newCards)
    }


    const handleSubmit = async () => {
        if (!name) return

        setIsSubmitting(true)
        try {
            const components: any[] = []

            if (templateType === "STANDARD") {
                // Header
                if (headerType !== "NONE") {
                    components.push({
                        type: "HEADER",
                        format: headerType,
                        text: headerType === "TEXT" ? headerText : undefined,
                        example: (headerType === "IMAGE" || headerType === "VIDEO") && headerHandle ? {
                            header_handle: [headerHandle]
                        } : undefined
                    })
                }

                // Body
                components.push({ type: "BODY", text: bodyText })

                // Footer
                if (footerText) components.push({ type: "FOOTER", text: footerText })

                // Buttons
                if (buttons.length > 0) {
                    components.push({
                        type: "BUTTONS",
                        buttons: buttons.map(b => ({
                            type: b.type,
                            text: b.text,
                            url: b.type === "URL" ? b.url : undefined,
                            phone_number: b.type === "PHONE_NUMBER" ? b.phone_number : undefined,
                            example: b.type === "COPY_CODE" ? b.example : undefined
                        }))
                    })
                }
            } else if (templateType === "CAROUSEL") {
                // CAROUSEL
                components.push({ type: "BODY", text: bodyText || "Carousel Message" }) // Main body is required? Meta says "Body is required for the message bubble that contains the carousel"

                const cards = carouselCards.map(card => {
                    const cardComponents: any[] = [
                        {
                            type: "HEADER",
                            format: card.headerType,
                            example: card.headerHandle ? { header_handle: [card.headerHandle] } : undefined
                        },
                        { type: "BODY", text: card.bodyText }
                    ]

                    if (card.buttons.length > 0) {
                        cardComponents.push({
                            type: "BUTTONS",
                            buttons: card.buttons.map(b => ({
                                type: b.type,
                                text: b.text,
                                url: b.type === "URL" ? b.url : undefined,
                                phone_number: b.type === "PHONE_NUMBER" ? b.phone_number : undefined
                            }))
                        })
                    }

                    return {
                        components: cardComponents
                    }
                })

                components.push({
                    type: "CAROUSEL",
                    cards: cards
                })
            } else if (templateType === "PRODUCT_CAROUSEL") {
                // PRODUCT CAROUSEL
                if (!catalogId) {
                    alert("يجب تحديد معرف الكتالوج لقالب كاروسيل المنتجات")
                    setIsSubmitting(false)
                    return
                }
                if (productCarouselCards.length < 2 || productCarouselCards.length > 10) {
                    alert("يجب اختيار من 2 إلى 10 منتجات")
                    setIsSubmitting(false)
                    return
                }

                components.push({ type: "BODY", text: bodyText || "Product Carousel" })

                components.push({
                    type: "PRODUCT_CAROUSEL",
                    catalog_id: catalogId,
                    products: productCarouselCards.map(card => ({
                        product_retailer_id: card.productId,
                        body: card.bodyText,
                        button: {
                            type: card.buttonType,
                            url: card.buttonType === "URL" ? card.buttonUrl : undefined
                        }
                    }))
                })
            } else if (templateType === "CATALOG") {
                // CATALOG TEMPLATE
                if (!catalogId) {
                    alert("يجب تحديد معرف الكتالوج")
                    setIsSubmitting(false)
                    return
                }

                // Header (optional but recommended)
                if (catalogHeaderHandle) {
                    components.push({
                        type: "HEADER",
                        format: "IMAGE",
                        example: { header_handle: [catalogHeaderHandle] }
                    })
                }

                // Body
                components.push({ type: "BODY", text: catalogBodyText || "View our catalog" })

                // Footer (optional)
                if (footerText) components.push({ type: "FOOTER", text: footerText })

                // Catalog button (automatic)
                components.push({
                    type: "BUTTONS",
                    buttons: [{
                        type: "CATALOG",
                        text: "View Catalog"
                    }]
                })

                // Store catalog_id in component metadata
                components.push({
                    type: "CATALOG",
                    catalog_id: catalogId
                })
            }

            if (templateType === "CAROUSEL") {
                const invalidCardIndex = carouselCards.findIndex(c => c.buttons.length === 0)
                if (invalidCardIndex !== -1) {
                    alert(`البطاقة رقم ${invalidCardIndex + 1} يجب أن تحتوي على زر واحد على الأقل.`)
                    setIsSubmitting(false)
                    return
                }
            }

            if (templateType === "PRODUCT_CAROUSEL") {
                if (!catalogId) {
                    alert("يجب تحديد معرف الكتالوج لقالب كاروسيل المنتجات")
                    setIsSubmitting(false)
                    return
                }
                if (productCarouselCards.length < 2 || productCarouselCards.length > 10) {
                    alert("يجب اختيار من 2 إلى 10 منتجات")
                    setIsSubmitting(false)
                    return
                }
                const hasEmptyProduct = productCarouselCards.some(c => !c.productId)
                if (hasEmptyProduct) {
                    alert("جميع المنتجات يجب أن تحتوي على معرف المنتج")
                    setIsSubmitting(false)
                    return
                }
            }

            if (templateType === "CATALOG") {
                if (!catalogId) {
                    alert("يجب تحديد معرف الكتالوج")
                    setIsSubmitting(false)
                    return
                }
                if (!catalogBodyText.trim()) {
                    alert("يجب إدخال نص الرسالة")
                    setIsSubmitting(false)
                    return
                }
            }

            if (!currentOrganization?._id) throw new Error("Organization id not found");

            // Build Final Components with Samples
            const finalComponents = components.map(c => {
                if (c.type === "BODY") {
                    const vars = Array.from((c as any).text.matchAll(/{{(\d+)}}/g)).map((m: any) => m[1]);
                    if (vars.length > 0) {
                        const samples = vars.map(v => bodyVariableSamples[v] || "Sample");
                        return {
                            ...c,
                            example: { body_text: [samples] }
                        };
                    }
                }
                if (c.type === "HEADER" && c.format === "TEXT") {
                    const vars = Array.from((c as any).text.matchAll(/{{(\d+)}}/g)).map((m: any) => m[1]);
                    if (vars.length > 0) {
                        const samples = vars.map(v => headerVariableSamples[v] || "Sample");
                        return {
                            ...c,
                            example: { header_text: samples }
                        };
                    }
                }
                return c;
            });

            await createTemplate({
                organizationId: currentOrganization._id,
                userId: userId as any,
                name: name.toLowerCase().replace(/\s+/g, '_'),
                category,
                language,
                components: finalComponents
            })

            router.push("/templates?success=true")
        } catch (error) {
            logger.error("Failed to create template:", error)
            alert("فشل إنشاء القالب. " + String(error))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-[1400px] mx-auto p-6 sm:p-10 animate-in fade-in duration-500" dir="rtl">
            {/* Hidden File Input */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,video/*"
            />

            {/* Header */}
            <div className="flex items-center gap-5 mb-10">
                <Button variant="ghost" size="icon" onClick={() => router.push("/templates")} className="rounded-full h-12 w-12 hover:bg-muted transition-all">
                    <ArrowRight className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">{editName ? "نسخ وتعديل قالب" : "إنشاء قالب جديد"}</h1>
                    <p className="text-base text-muted-foreground font-medium">صمم رسالة WhatsApp تفاعلية وجذابة واحترافية</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Editor Column */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="border border-border/50 bg-card rounded-[24px] shadow-none overflow-hidden">
                        <CardContent className="p-8 space-y-10">
                            {/* Section 1: Identity */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-border/20 pb-4">
                                    <div className="w-10 h-10 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary">
                                        <Badge className="bg-primary/20 text-primary border-none text-xs font-black h-6 w-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">هوية القالب واللغة</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-black text-muted-foreground uppercase tracking-widest mr-1">اسم القالب (إنجليزي)</Label>
                                        <Input
                                            placeholder="مثال: seasonal_promotion_2024"
                                            value={name}
                                            onChange={e => setName(e.target.value.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase())}
                                            className="font-mono h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20 transition-all shadow-none"
                                        />
                                        <div className="flex items-center gap-2 mt-2 px-1">
                                            <AlertCircle className="h-3 w-3 text-muted-foreground/40" />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">أحرف صغيرة وشرطة سفلية فقط (Meta Policy)</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-black text-muted-foreground uppercase tracking-widest mr-1">اللغة المستهدفة</Label>
                                        <Select value={language} onValueChange={setLanguage}>
                                            <SelectTrigger className="h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[16px]">
                                                <SelectItem value="ar" className="font-bold">العربية (Arabic)</SelectItem>
                                                <SelectItem value="en" className="font-bold">الإنجليزية (English)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Type & Category */}
                            <div className="space-y-6 pt-10 border-t border-border/10">
                                <div className="flex items-center gap-3 border-b-2 border-border/20 pb-4">
                                    <div className="w-10 h-10 rounded-[14px] bg-primary/10 flex items-center justify-center text-primary">
                                        <Badge className="bg-primary/20 text-primary border-none text-xs font-black h-6 w-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight">التصنيف والغرض من القالب</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                                    <div className="space-y-3">
                                        <Label className="text-sm font-black text-muted-foreground uppercase tracking-widest mr-1">فئة الرسالة</Label>
                                        <Select value={category} onValueChange={setCategory}>
                                            <SelectTrigger className="h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-[16px]">
                                                <SelectItem value="MARKETING" className="font-bold">تسويق (Marketing) - عروض وترويج</SelectItem>
                                                <SelectItem value="UTILITY" className="font-bold">خدمي (Utility) - تحديثات الطلبات</SelectItem>
                                                <SelectItem value="AUTHENTICATION" className="font-bold">توثيق (Auth) - أكواد التحقق</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-black text-muted-foreground uppercase tracking-widest mr-1">نوع هيكل القالب</Label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: "STANDARD", icon: FileText, label: "قياسي" },
                                                { id: "CAROUSEL", icon: Layers, label: "كاروسيل" },
                                                { id: "PRODUCT_CAROUSEL", icon: ShoppingBag, label: "منتجات", isEcom: true },
                                                { id: "CATALOG", icon: ShoppingBag, label: "كتالوج", isEcom: true }
                                            ]
                                                .filter(type => !type.isEcom || isEcomConnected)
                                                .map((type) => {
                                                    return (
                                                        <div
                                                            key={type.id}
                                                            onClick={() => setTemplateType(type.id as any)}
                                                            className={cn(
                                                                "border-2 rounded-[18px] p-3 cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 text-center relative overflow-hidden",
                                                                templateType === type.id
                                                                    ? "border-primary bg-primary/5 text-primary"
                                                                    : "border-border/50 bg-muted/5 hover:border-primary/20 text-muted-foreground"
                                                            )}
                                                        >
                                                            <type.icon className={cn("h-5 w-5", templateType === type.id ? "text-primary" : "text-muted-foreground/30")} />
                                                            <span className="text-[11px] font-black leading-tight">{type.label}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="opacity-40" />

                            {templateType === "STANDARD" ? (
                                // --- STANDARD EDITOR ---
                                <div className="space-y-12">
                                    {/* Content Step 1: Visual Header */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">3</div>
                                            <h3 className="text-lg font-black tracking-tight">رأس الرسالة (Header Content)</h3>
                                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[10px]">اختياري</Badge>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <RadioGroup
                                                value={headerType}
                                                onValueChange={(v: any) => setHeaderType(v)}
                                                className="flex flex-wrap gap-4"
                                            >
                                                {[
                                                    { id: "NONE", label: "بدون", icon: X },
                                                    { id: "TEXT", label: "نص", icon: Type },
                                                    { id: "IMAGE", label: "صورة", icon: ImageIcon },
                                                    { id: "VIDEO", label: "فيديو", icon: Video }
                                                ].map(h => {
                                                    const isDisabled = category === "AUTHENTICATION" && h.id !== "NONE";
                                                    return (
                                                        <div key={h.id} className={cn(
                                                            "flex items-center gap-2 border-2 rounded-[16px] px-5 py-3 cursor-pointer transition-all",
                                                            headerType === h.id ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-primary/20 bg-background",
                                                            isDisabled && "opacity-40 grayscale cursor-not-allowed pointer-events-none"
                                                        )}>
                                                            <RadioGroupItem value={h.id} id={`h-${h.id}`} className="sr-only" />
                                                            <Label htmlFor={`h-${h.id}`} className="cursor-pointer flex items-center gap-2 font-black text-xs">
                                                                <h.icon className={cn("h-4 w-4", headerType === h.id ? "text-primary" : "text-muted-foreground/30")} />
                                                                {h.label}
                                                                {isDisabled && h.id === "VIDEO" && <span className="text-[8px] font-bold">(غير مسموح لـ Auth)</span>}
                                                            </Label>
                                                        </div>
                                                    );
                                                })}
                                            </RadioGroup>

                                            {category === "AUTHENTICATION" && (
                                                <p className="text-[10px] font-bold text-destructive/70 mt-2 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> قوالب التوثيق (Authentication) لا تدعم الرؤوس (Headers) وفق قوانين Meta.
                                                </p>
                                            )}

                                            {headerType === "TEXT" && (
                                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                    <Input
                                                        placeholder="اكتب عنوان الرسالة هنا..."
                                                        value={headerText}
                                                        onChange={e => setHeaderText(e.target.value)}
                                                        maxLength={60}
                                                        className="h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20"
                                                    />
                                                    {headerVariables.length > 0 && (
                                                        <div className="p-5 bg-primary/[0.03] border-2 border-primary/10 rounded-[20px] space-y-3">
                                                            <div className="flex items-center gap-2 opacity-70">
                                                                <Variable className="h-3 w-3 text-primary" />
                                                                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">تخصيص متغيرات الرأس</p>
                                                            </div>
                                                            {headerVariables.map(v => (
                                                                <Input
                                                                    key={v}
                                                                    placeholder={`عينة لـ {{${v}}} (مثال: أحمد)...`}
                                                                    value={headerVariableSamples[v] || ""}
                                                                    onChange={(e) => setHeaderVariableSamples(prev => ({ ...prev, [v]: e.target.value }))}
                                                                    className="h-10 rounded-[12px] border-2 border-border/40 focus:border-primary bg-background font-bold text-sm"
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {(headerType === "IMAGE" || headerType === "VIDEO") && (
                                                <div className="flex gap-6 items-center border-2 border-border/40 rounded-[20px] p-5 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                                                    <div className="h-24 w-24 bg-white border-2 border-border/50 rounded-[16px] overflow-hidden flex items-center justify-center shadow-sm relative group">
                                                        {headerPreviewUrl ? (
                                                            <>
                                                                {headerType === "IMAGE" ? (
                                                                    <img src={headerPreviewUrl} className="h-full w-full object-cover" alt="Preview" />
                                                                ) : (
                                                                    <video src={headerPreviewUrl} className="h-full w-full object-cover" muted playsInline />
                                                                )}
                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <Upload className="h-6 w-6 text-white" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1">
                                                                {headerType === "IMAGE" ? <ImageIcon className="h-8 w-8 text-muted-foreground/30" /> : <Video className="h-8 w-8 text-muted-foreground/30" />}
                                                                <span className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-tighter">مفقود</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <h4 className="font-black text-sm text-foreground">{headerType === "VIDEO" ? "فيديو نموذج للمراجعة" : "صورة نموذج للمراجعة"}</h4>
                                                        <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                                            {headerType === "VIDEO"
                                                                ? "يجب أن يكون الفيديو (MP4/MOV) أقل من 16MB. هذا الفيديو ضروري لموافقة Meta."
                                                                : "ارفع صورة نموذجية لتوضيح الفكرة لمن يراجع القالب في Meta."}
                                                        </p>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => triggerUpload("HEADER")}
                                                            disabled={uploadingMedia}
                                                            className="h-10 px-6 mt-2 rounded-[12px] border-2 border-primary/20 text-primary font-black hover:bg-primary/5 transition-all"
                                                        >
                                                            {uploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                                            {headerType === "VIDEO" ? "رفع الفيديو الآن" : "رفع الصورة الآن"}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Step 2: Message Body */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">4</div>
                                            <h3 className="text-lg font-black tracking-tight">محتوى الرسالة الأساسي</h3>
                                            <Badge className="bg-danger/10 text-danger border-none font-bold text-[10px]">إجباري</Badge>
                                        </div>

                                        <div className="space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <Textarea
                                                    placeholder="اكتب رسالتك الذكية هنا... استخدم {{1}} للمتغيرات مثل الأسماء أو المواعيد."
                                                    value={bodyText}
                                                    onChange={e => setBodyText(e.target.value)}
                                                    className="min-h-[160px] text-base rounded-[20px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20 transition-all p-6 leading-[1.8] shadow-none resize-none"
                                                />
                                                <div className="flex justify-between items-center px-2">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">يمكنك استخدام الصيغ (بولد، إيتاليك) و الروابط.</p>
                                                    <span className={cn("text-[10px] font-black", bodyText.length > 1024 ? "text-danger" : "text-muted-foreground/40")}>{bodyText.length}/1024</span>
                                                </div>
                                            </div>

                                            {bodyVariables.length > 0 && (
                                                <div className="p-6 bg-slate-50/80 border-2 border-border/40 rounded-[24px] space-y-5 animate-in slide-in-from-top-3 duration-500">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Variable className="h-3 w-3 text-primary" />
                                                        </div>
                                                        <h4 className="text-[11px] font-black text-foreground uppercase tracking-wider">عينات المتغيرات للـ Meta</h4>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        {bodyVariables.map((v) => (
                                                            <div key={v} className="space-y-1.5 group">
                                                                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70 group-focus-within:text-primary transition-colors pr-1">قيمة عشوائية لـ {'{{' + v + '}}'}</Label>
                                                                <Input
                                                                    placeholder={`مثال لـ ${v}...`}
                                                                    value={bodyVariableSamples[v] || ""}
                                                                    onChange={(e) => setBodyVariableSamples(prev => ({ ...prev, [v]: e.target.value }))}
                                                                    className="h-11 rounded-[14px] border-2 border-border/40 focus:border-primary bg-background font-bold transition-all text-sm"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content Step 3: Footer & Buttons */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">5</div>
                                            <h3 className="text-lg font-black tracking-tight">الإضافات التفاعلية</h3>
                                            <Badge variant="outline" className="border-slate-200 text-slate-400 font-bold text-[10px]">اختياري</Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-2">
                                            {/* Footer Column */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <LayoutTemplate className="h-4 w-4 rotate-180 text-muted-foreground/40" />
                                                    <Label className="font-black text-sm">تذييل الرسالة (Footer)</Label>
                                                </div>
                                                <Input
                                                    placeholder="نص خفيف أسفل الرسالة..."
                                                    value={footerText}
                                                    onChange={e => setFooterText(e.target.value)}
                                                    maxLength={60}
                                                    className="h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background shadow-none"
                                                />
                                                <p className="text-[9px] font-bold text-muted-foreground/60 leading-relaxed">هذا النص يظهر بحجم أصغير ولون رمادي أسفل الرسالة مباشرة.</p>
                                            </div>

                                            {/* Buttons Column */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <MousePointerClick className="h-4 w-4 text-muted-foreground/40" />
                                                        <Label className="font-black text-sm">الأزرار التفاعلية</Label>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="h-9 px-4 rounded-[10px] border-2 border-primary/20 text-primary font-black hover:bg-primary/5 shadow-none" disabled={buttons.length >= 3}>
                                                                <Plus className="h-3.5 w-3.5 mr-1" /> إضافة
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent className="rounded-[16px] p-2 min-w-[180px] shadow-xl border-border/40">
                                                            {category === "AUTHENTICATION" ? (
                                                                <DropdownMenuItem onClick={() => handleAddButton("COPY_CODE")} className="rounded-[10px] font-bold cursor-pointer py-2.5">زر نسخ الكود (Copy Code)</DropdownMenuItem>
                                                            ) : (
                                                                <>
                                                                    <DropdownMenuItem onClick={() => handleAddButton("QUICK_REPLY")} className="rounded-[10px] font-bold cursor-pointer py-2.5">رد سريع (Quick Reply)</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleAddButton("URL")} className="rounded-[10px] font-bold cursor-pointer py-2.5">رابط موقع (CTA)</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleAddButton("PHONE_NUMBER")} className="rounded-[10px] font-bold cursor-pointer py-2.5">رقم هاتف (Call)</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleAddButton("COPY_CODE")} className="rounded-[10px] font-bold cursor-pointer py-2.5">نسخ كود خصم</DropdownMenuItem>
                                                                </>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>

                                                <div className="space-y-3">
                                                    {buttons.map((btn, idx) => (
                                                        <div key={idx} className="bg-white border-2 border-border/40 p-4 rounded-[20px] space-y-4 relative group hover:border-primary/20 transition-all shadow-sm">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleRemoveButton(idx)}
                                                                className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-danger text-white hover:bg-danger/90 hover:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </Button>

                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-[10px] bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs">{idx + 1}</div>
                                                                <div className="flex-1 flex gap-3">
                                                                    <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] uppercase h-9 px-4 flex items-center">{btn.type.replace('_', ' ')}</Badge>
                                                                    <Input
                                                                        placeholder="نص الزر..."
                                                                        value={btn.text}
                                                                        onChange={e => handleButtonChange(idx, "text", e.target.value)}
                                                                        maxLength={25}
                                                                        className="h-9 border-none font-bold text-sm bg-muted/40 rounded-[10px] focus-visible:ring-0"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {btn.type === "URL" && (
                                                                <div className="flex items-center gap-3 pl-11">
                                                                    <Link2 className="h-3.5 w-3.5 text-muted-foreground/30" />
                                                                    <Input
                                                                        placeholder="https://yourwebsite.com"
                                                                        value={btn.url}
                                                                        onChange={e => handleButtonChange(idx, "url", e.target.value)}
                                                                        className="h-10 border-2 border-border/30 rounded-[12px] text-xs font-medium"
                                                                    />
                                                                </div>
                                                            )}
                                                            {btn.type === "PHONE_NUMBER" && (
                                                                <div className="flex items-center gap-3 pl-11">
                                                                    <Phone className="h-3.5 w-3.5 text-muted-foreground/30" />
                                                                    <Input
                                                                        placeholder="+966..."
                                                                        value={btn.phone_number}
                                                                        onChange={e => handleButtonChange(idx, "phone_number", e.target.value)}
                                                                        className="h-10 border-2 border-border/30 rounded-[12px] text-xs font-medium"
                                                                    />
                                                                </div>
                                                            )}
                                                            {btn.type === "COPY_CODE" && (
                                                                <div className="space-y-2 pl-11 pt-1 border-t-2 border-border/10">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">كود الخصم المراد نسخه</Label>
                                                                    <div className="flex items-center gap-3">
                                                                        <Copy className="h-3.5 w-3.5 text-muted-foreground/30" />
                                                                        <Input
                                                                            placeholder="مثال: SAVE20"
                                                                            value={btn.example}
                                                                            onChange={e => handleButtonChange(idx, "example", e.target.value)}
                                                                            className="h-10 border-2 border-border/30 rounded-[12px] text-xs font-black uppercase tracking-widest"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {buttons.length === 0 && (
                                                        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50/30">
                                                            <MousePointerClick className="h-6 w-6 text-slate-200 mb-2" />
                                                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">لا توجد أزرار تفاعلية</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) :
                                templateType === "CAROUSEL" ? (
                                    // --- CAROUSEL EDITOR ---
                                    <div className="space-y-12">
                                        <div className="bg-slate-50 border-2 border-border/40 p-5 rounded-[20px] text-[11px] font-black leading-relaxed text-muted-foreground uppercase tracking-wider flex items-start gap-4">
                                            <AlertCircle className="h-5 w-5 text-primary shrink-0" />
                                            تتيح لك قوالب الكاروسيل إرسال حتى 10 بطاقات قابلة للتمرير. يجب أن تحتوي جميع البطاقات على نفس هيكل الأزرار ونوع الوسائط.
                                        </div>

                                        {/* Carousel Step 1: Media Type */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">3</div>
                                                <h3 className="text-lg font-black tracking-tight">نوع الوسائط في البطاقات</h3>
                                            </div>

                                            <div className="pt-2">
                                                <RadioGroup
                                                    value={carouselHeaderType}
                                                    onValueChange={(v: "IMAGE" | "VIDEO") => handleCarouselTypeChange(v)}
                                                    className="flex gap-4"
                                                >
                                                    {[
                                                        { id: "IMAGE", label: "صورة (Image)", icon: ImageIcon },
                                                        { id: "VIDEO", label: "فيديو (Video)", icon: Video }
                                                    ].map(m => (
                                                        <div key={m.id} className={cn(
                                                            "flex items-center gap-2 border-2 rounded-[16px] px-6 py-3 cursor-pointer transition-all",
                                                            carouselHeaderType === m.id ? "border-primary bg-primary/5 text-primary" : "border-border/50 hover:border-primary/20 bg-background"
                                                        )}>
                                                            <RadioGroupItem value={m.id} id={`c-${m.id}`} className="sr-only" />
                                                            <Label htmlFor={`c-${m.id}`} className="cursor-pointer flex items-center gap-2 font-black text-xs">
                                                                <m.icon className={cn("h-4 w-4", carouselHeaderType === m.id ? "text-primary" : "text-muted-foreground/30")} />
                                                                {m.label}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                            </div>
                                        </div>

                                        {/* Carousel Step 2: Main Body */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">4</div>
                                                <h3 className="text-lg font-black tracking-tight">نص الرسالة الرئيسي</h3>
                                            </div>
                                            <div className="pt-2">
                                                <Textarea
                                                    placeholder="اكتب مقدمة للكاروسيل تظهر قبل البطاقات..."
                                                    value={bodyText}
                                                    onChange={e => setBodyText(e.target.value)}
                                                    className="min-h-[100px] text-base rounded-[20px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20 p-5 shadow-none resize-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Carousel Step 3: Cards Editor */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b-2 border-border/10 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">5</div>
                                                    <h3 className="text-lg font-black tracking-tight">إدارة البطاقات ({carouselCards.length}/10)</h3>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={addCard} disabled={carouselCards.length >= 10} className="h-9 rounded-[10px] border-2 border-primary/20 text-primary font-black hover:bg-primary/5 shadow-none">
                                                    <Plus className="h-4 w-4 mr-1" /> إضافة بطاقة
                                                </Button>
                                            </div>

                                            <Tabs defaultValue="card-0" className="w-full">
                                                <TabsList className="w-full justify-start overflow-x-auto h-auto p-2 bg-slate-100/50 rounded-[18px] gap-2 border-2 border-slate-100">
                                                    {carouselCards.map((_, i) => (
                                                        <TabsTrigger key={i} value={`card-${i}`} className="rounded-[12px] px-6 py-2.5 font-black text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
                                                            البطاقة {i + 1}
                                                        </TabsTrigger>
                                                    ))}
                                                </TabsList>

                                                {carouselCards.map((card, i) => (
                                                    <TabsContent key={i} value={`card-${i}`} className="space-y-8 border-2 border-slate-100 rounded-[24px] p-6 mt-6 animate-in fade-in-50 duration-500 shadow-sm bg-white">
                                                        <div className="flex justify-between items-center bg-slate-50/50 -mx-6 -mt-6 p-4 rounded-t-[22px] border-b-2 border-border/10 px-6">
                                                            <h4 className="font-black text-sm text-foreground uppercase tracking-widest">محتويات بطاقة رقم {i + 1}</h4>
                                                            {carouselCards.length > 1 && (
                                                                <Button size="icon" variant="ghost" onClick={() => removeCard(i)} className="h-8 w-8 text-danger hover:bg-danger/10 hover:text-danger rounded-full">
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                            {/* Card Media Column */}
                                                            <div className="md:col-span-4 space-y-3">
                                                                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">صورة/فيديو البطاقة</Label>
                                                                <div className="aspect-square bg-slate-100 border-2 border-border/40 rounded-[20px] overflow-hidden flex flex-col items-center justify-center gap-3 group relative cursor-pointer" onClick={() => triggerUpload(i)}>
                                                                    {card.headerUrl ? (
                                                                        <img src={card.headerUrl} className="h-full w-full object-cover" alt="Preview" />
                                                                    ) : (
                                                                        <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                                                                    )}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                                                        <Upload className="h-5 w-5 text-white" />
                                                                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">تغيير الوسائط</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <ProductPicker
                                                                        onSelect={(p) => handleSallaProductSelect(p, i)}
                                                                        trigger={
                                                                            <Button size="sm" variant="outline" className="w-full h-9 rounded-[10px] border-2 border-purple-200 text-purple-600 font-black hover:bg-purple-50 text-[10px]">
                                                                                <ShoppingBag className="h-3.5 w-3.5 mr-1" /> سلة
                                                                            </Button>
                                                                        }
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Card Content Column */}
                                                            <div className="md:col-span-8 space-y-6">
                                                                <div className="space-y-3">
                                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">وصف البطاقة</Label>
                                                                    <Input
                                                                        value={card.bodyText}
                                                                        onChange={e => updateCard(i, "bodyText", e.target.value)}
                                                                        placeholder="وصف المنتج، السعر، أو العرض..."
                                                                        className="h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background shadow-none"
                                                                    />
                                                                </div>

                                                                <div className="space-y-4 pt-4 border-t-2 border-border/10">
                                                                    <div className="flex items-center justify-between">
                                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">أزرار البطاقة</Label>
                                                                        <p className="text-[9px] font-bold text-muted-foreground/40 italic">تطبق على جميع البطاقات</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {card.buttons.map((btn, btnIdx) => (
                                                                            <div key={btnIdx} className="flex gap-2 bg-slate-50 p-2 rounded-[14px] border-2 border-border/30 animate-in zoom-in-95">
                                                                                <Input
                                                                                    value={btn.text}
                                                                                    onChange={e => handleButtonChange(btnIdx, "text", e.target.value, true)}
                                                                                    className="h-8 border-none bg-white text-[11px] font-black w-32 rounded-[8px]"
                                                                                />
                                                                                {btn.type === "URL" && (
                                                                                    <Input
                                                                                        value={btn.url}
                                                                                        onChange={e => handleButtonChange(btnIdx, "url", e.target.value, true)}
                                                                                        placeholder="URL"
                                                                                        className="h-8 border-none bg-white text-[10px] w-40 rounded-[8px]"
                                                                                    />
                                                                                )}
                                                                                <Button size="icon" variant="ghost" onClick={() => handleRemoveButton(btnIdx, true)} className="h-8 w-8 text-muted-foreground/40 hover:text-danger rounded-[8px]"><X className="h-3.5 w-3.5" /></Button>
                                                                            </div>
                                                                        ))}
                                                                        {card.buttons.length < 2 && (
                                                                            <div className="flex gap-2">
                                                                                <Button size="sm" variant="outline" onClick={() => handleAddButton("QUICK_REPLY", true)} className="h-8 border-2 border-dashed border-slate-300 text-[10px] font-black text-slate-400 rounded-[10px]">+ رد سريع</Button>
                                                                                <Button size="sm" variant="outline" onClick={() => handleAddButton("URL", true)} className="h-8 border-2 border-dashed border-slate-300 text-[10px] font-black text-slate-400 rounded-[10px]">+ رابط (CTA)</Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        </div>
                                    </div>
                                ) : templateType === "PRODUCT_CAROUSEL" ? (
                                    // --- PRODUCT CAROUSEL EDITOR ---
                                    <div className="space-y-12">
                                        <div className="bg-purple-50 border-2 border-purple-100 p-5 rounded-[20px] text-[11px] font-black leading-relaxed text-purple-700 uppercase tracking-wider flex items-start gap-4">
                                            <ShoppingBag className="h-5 w-5 text-purple-500 shrink-0" />
                                            قوالب كاروسيل المنتجات تتيح إرسال حتى 10 منتجات من كتالوجك. يجب أن تكون المنتجات مرتبطة بكتالوج Meta مربوط بسلة.
                                        </div>

                                        {/* Ecom Step 1: Catalog ID */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">3</div>
                                                <h3 className="text-lg font-black tracking-tight">إعدادات الكتالوج</h3>
                                            </div>
                                            <div className="pt-2 space-y-3">
                                                <Label className="text-sm font-black text-muted-foreground uppercase tracking-widest mr-1">معرف الكتالوج (Catalog ID)</Label>
                                                <Input
                                                    value={catalogId}
                                                    onChange={(e) => setCatalogId(e.target.value)}
                                                    placeholder="أدخل معرف الكتالوج من Meta Business Manager..."
                                                    className="font-mono h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20 shadow-none uppercase"
                                                />
                                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-1 flex items-center gap-2">
                                                    <AlertCircle className="h-3 w-3" /> يمكنك العثور على المعرف في إعدادات Meta Commerce Manager.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Ecom Step 2: Main Body */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">4</div>
                                                <h3 className="text-lg font-black tracking-tight">نص الرسالة الرئيسي</h3>
                                            </div>
                                            <div className="pt-2">
                                                <Textarea
                                                    value={bodyText}
                                                    onChange={(e) => setBodyText(e.target.value)}
                                                    placeholder="رسالة تظهر مع قائمة المنتجات... تستخدم لتوضيح غرض العرض."
                                                    className="min-h-[120px] text-base rounded-[20px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20 p-5 px-6 leading-relaxed shadow-none resize-none"
                                                />
                                            </div>
                                        </div>

                                        {/* Ecom Step 3: Product List */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between border-b-2 border-border/10 pb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">5</div>
                                                    <h3 className="text-lg font-black tracking-tight">اختيار المنتجات ({productCarouselCards.length}/10)</h3>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setProductCarouselCards([...productCarouselCards, { productId: "", buttonType: "VIEW" }])}
                                                    disabled={productCarouselCards.length >= 10}
                                                    className="h-9 rounded-[10px] border-2 border-primary/20 text-primary font-black hover:bg-primary/5 shadow-none"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" /> إضافة منتج
                                                </Button>
                                            </div>

                                            {productCarouselCards.length === 0 ? (
                                                <div className="border-2 border-dashed border-slate-200 rounded-[24px] p-12 text-center bg-slate-50/20 group hover:border-primary/20 transition-all cursor-pointer" onClick={() => setProductCarouselCards([{ productId: "", buttonType: "VIEW" }])}>
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                                        <ShoppingBag className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <h4 className="font-black text-slate-400 uppercase tracking-[2px]">لم يتم اختيار أي منتج</h4>
                                                    <p className="text-[11px] text-slate-300 mt-2 font-bold uppercase tracking-tight">اختر من 2 إلى 10 منتجات لعرض الكاروسيل</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {productCarouselCards.map((card, idx) => (
                                                        <div key={idx} className="bg-white border-2 border-border/40 p-5 rounded-[24px] space-y-5 animate-in zoom-in-95 group relative hover:border-primary/20 transition-all shadow-sm">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setProductCarouselCards(productCarouselCards.filter((_, i) => i !== idx))}
                                                                className="absolute -top-2 -left-2 h-7 w-7 rounded-full bg-danger text-white hover:bg-danger/90 hover:text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>

                                                            <div className="space-y-4">
                                                                <div className="space-y-1.5 px-1">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">معرف المنتج (Retailer ID)</Label>
                                                                    <Input
                                                                        value={card.productId}
                                                                        onChange={(e) => {
                                                                            const newCards = [...productCarouselCards]
                                                                            newCards[idx].productId = e.target.value
                                                                            setProductCarouselCards(newCards)
                                                                        }}
                                                                        placeholder="PROD-123456"
                                                                        className="font-mono h-10 rounded-[12px] border-2 border-border/30 font-black shadow-none bg-slate-50/50 uppercase"
                                                                    />
                                                                </div>

                                                                <div className="space-y-1.5 px-1">
                                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">نص إضافي (اختياري)</Label>
                                                                    <Input
                                                                        value={card.bodyText || ""}
                                                                        onChange={(e) => {
                                                                            const newCards = [...productCarouselCards]
                                                                            newCards[idx].bodyText = e.target.value
                                                                            setProductCarouselCards(newCards)
                                                                        }}
                                                                        placeholder="مثال: خصم خاص 20%..."
                                                                        className="h-10 rounded-[12px] border-2 border-border/30 font-bold shadow-none text-sm"
                                                                    />
                                                                </div>

                                                                <div className="pt-2 border-t border-border/10 flex gap-3">
                                                                    <Badge className="bg-slate-100 text-slate-500 border-none font-black text-[9px] h-8 px-3">الزر:</Badge>
                                                                    <Select
                                                                        value={card.buttonType}
                                                                        onValueChange={(value: "VIEW" | "URL") => {
                                                                            const newCards = [...productCarouselCards]
                                                                            newCards[idx].buttonType = value
                                                                            setProductCarouselCards(newCards)
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="h-8 border-none bg-muted/40 font-bold text-xs rounded-[10px] w-[140px] focus:ring-0">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="rounded-[12px]">
                                                                            <SelectItem value="VIEW" className="text-xs font-bold">عرض (داخل التطبيق)</SelectItem>
                                                                            <SelectItem value="URL" className="text-xs font-bold">رابط خارجي (URL)</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>

                                                                    {card.buttonType === "URL" && (
                                                                        <Input
                                                                            value={card.buttonUrl || ""}
                                                                            onChange={(e) => {
                                                                                const newCards = [...productCarouselCards]
                                                                                newCards[idx].buttonUrl = e.target.value
                                                                                setProductCarouselCards(newCards)
                                                                            }}
                                                                            placeholder="https://..."
                                                                            className="h-8 border-2 border-border/20 rounded-[10px] text-[10px] font-medium flex-1 px-3 shadow-none"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : templateType === "CATALOG" ? (
                                    // --- CATALOG TEMPLATE EDITOR ---
                                    <div className="space-y-12">
                                        <div className="bg-emerald-50 border-2 border-emerald-100 p-5 rounded-[20px] text-[11px] font-black leading-relaxed text-emerald-700 uppercase tracking-wider flex items-start gap-4">
                                            <AlertCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                                            قوالب الكتالوج تعرض كتالوج المنتجات الكامل بشكل تفاعلي. سيتم إضافة زر "عرض الكتالوج" تلقائياً عند الإنشاء.
                                        </div>

                                        {/* Catalog Step 1: Catalog ID */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">3</div>
                                                <h3 className="text-lg font-black tracking-tight">إقران متجر الكتالوج</h3>
                                            </div>
                                            <div className="pt-2">
                                                <Label className="text-sm font-black text-muted-foreground uppercase tracking-widest mr-1">معرف الكتالوج (Meta Catalog ID)</Label>
                                                <Input
                                                    value={catalogId}
                                                    onChange={(e) => setCatalogId(e.target.value)}
                                                    placeholder="أدخل معرف الكتالوج من Meta..."
                                                    className="font-mono h-12 rounded-[14px] border-2 border-border/50 font-bold bg-background focus:ring-primary/20 shadow-none uppercase"
                                                />
                                            </div>
                                        </div>

                                        {/* Catalog Step 2: Content */}
                                        <div className="space-y-8">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-[12px] bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">4</div>
                                                <h3 className="text-lg font-black tracking-tight">محتوى رسالة الكتالوج</h3>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pt-2">
                                                <div className="md:col-span-4 space-y-4">
                                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">صورة الغلاف (اختياري)</Label>
                                                    <div className="aspect-[4/3] bg-slate-100 border-2 border-border/40 rounded-[20px] overflow-hidden flex flex-col items-center justify-center relative group cursor-pointer" onClick={() => { setActiveUploadField("HEADER"); fileInputRef.current?.click(); }}>
                                                        {catalogHeaderPreviewUrl ? (
                                                            <>
                                                                <img src={catalogHeaderPreviewUrl} alt="Header" className="w-full h-full object-cover" />
                                                                <Button
                                                                    size="icon"
                                                                    variant="destructive"
                                                                    className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setCatalogHeaderHandle("");
                                                                        setCatalogHeaderPreviewUrl("");
                                                                    }}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                                                                <Upload className="h-6 w-6 text-slate-300" />
                                                                <span className="text-[9px] font-black text-slate-300 uppercase">رفع صورة غلاف</span>
                                                            </div>
                                                        )}
                                                        {uploadingMedia && (
                                                            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:col-span-8 space-y-6">
                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">نص الرسالة الأساسي</Label>
                                                        <Textarea
                                                            value={catalogBodyText}
                                                            onChange={(e) => setCatalogBodyText(e.target.value)}
                                                            placeholder="استعرض منتجاتنا الأكثر مبيعاً الآن..."
                                                            className="min-h-[120px] text-base rounded-[20px] border-2 border-border/50 font-bold bg-background shadow-none p-5 resize-none leading-relaxed"
                                                            rows={4}
                                                        />
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">تذييل الكتالوج (اختياري)</Label>
                                                        <Input
                                                            value={footerText}
                                                            onChange={(e) => setFooterText(e.target.value)}
                                                            placeholder="نص تذييل الرسالة..."
                                                            className="h-11 rounded-[14px] border-2 border-border/50 font-bold bg-background shadow-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3 pt-6 border-t border-border/30">
                        <Button
                            variant="ghost"
                            onClick={() => router.push("/templates")}
                            className="h-12 px-8 rounded-[14px] font-bold text-muted-foreground hover:bg-muted/50"
                        >
                            إلغاء
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-primary hover:bg-primary/95 text-white h-12 px-12 rounded-[14px] font-black shadow-none active:scale-95 transition-all"
                            disabled={
                                isSubmitting ||
                                !name ||
                                (templateType === "STANDARD" && !bodyText) ||
                                (templateType === "CAROUSEL" && !bodyText) ||
                                (templateType === "PRODUCT_CAROUSEL" && (!catalogId || productCarouselCards.length < 2)) ||
                                (templateType === "CATALOG" && (!catalogId || !catalogBodyText))
                            }
                        >
                            {isSubmitting ? "جاري الإرسال..." : "إرسال للمراجعة"}
                        </Button>
                    </div>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-4">
                    <div className="sticky top-8">
                        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-900 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-none flex flex-col">
                            {/* ... (Same frame elements) ... */}
                            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>

                            {/* WhatsApp Header */}
                            <div className="bg-[#008069] dark:bg-[#202c33] p-3 pt-8 flex items-center gap-2 text-white z-10 rounded-t-[2rem]">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                    <Smartphone className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-semibold">معاينة مباشرة</div>
                                </div>
                            </div>

                            {/* Message Area */}
                            <div className="flex-1 p-3 overflow-y-auto bg-[#E5DDD5] dark:bg-[#111b21] bg-opacity-90 relative rounded-b-[2rem] flex flex-col">
                                {templateType === "STANDARD" ? (
                                    <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%] mb-2">
                                        {/* Standard Preview */}
                                        {headerType !== "NONE" && (
                                            <div className="mb-2">
                                                {headerType === "TEXT" && <p className="font-bold text-sm">{headerText || "عنوان الرسالة"}</p>}
                                                {(headerType === "IMAGE" || headerType === "VIDEO") && (
                                                    <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 flex items-center justify-center overflow-hidden">
                                                        {headerPreviewUrl ? (
                                                            headerType === "IMAGE" ? (
                                                                <img src={headerPreviewUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <video src={headerPreviewUrl} className="w-full h-full object-cover" autoPlay muted loop />
                                                            )
                                                        ) : (
                                                            headerType === "IMAGE" ? <ImageIcon className="h-8 w-8 text-muted-foreground" /> : <Video className="h-8 w-8 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{bodyText || "نص الرسالة..."}</p>
                                        {footerText && <p className="text-[10px] text-gray-500 mt-2">{footerText}</p>}

                                        {/* Standard Buttons */}
                                        <div className="border-t mt-2 pt-2 space-y-1">
                                            {buttons.map((btn, i) => (
                                                <div key={i} className="text-center text-sm text-[#00a884] font-medium py-1">{btn.text || "زر"}</div>
                                            ))}
                                        </div>
                                    </div>
                                ) : templateType === "CAROUSEL" ? (
                                    <div className="space-y-2">
                                        <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%]">
                                            <p className="text-sm whitespace-pre-wrap">{bodyText || "مقدمة الكاروسيل..."}</p>
                                        </div>
                                        {/* Carousel Cards Preview (Horizontal Scroll) */}
                                        <div className="flex overflow-x-auto gap-2 pb-2 -mx-3 px-3">
                                            {carouselCards.map((card, i) => (
                                                <div key={i} className="bg-white dark:bg-[#202c33] rounded-lg shadow-sm min-w-[200px] max-w-[200px] overflow-hidden shrink-0">
                                                    <div className="h-24 bg-gray-200 flex items-center justify-center overflow-hidden">
                                                        {card.headerUrl ? (
                                                            carouselHeaderType === "IMAGE" ? (
                                                                <img src={card.headerUrl} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <video src={card.headerUrl} className="w-full h-full object-cover" autoPlay muted loop />
                                                            )
                                                        ) : (
                                                            carouselHeaderType === "IMAGE" ? <ImageIcon className="h-6 w-6 text-muted-foreground" /> : <Video className="h-6 w-6 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-sm font-medium">{card.bodyText || "وصف البطاقة..."}</p>
                                                        <div className="mt-2 space-y-1">
                                                            {card.buttons.map((btn, bI) => (
                                                                <div key={bI} className="bg-gray-50 p-1 text-center text-xs text-[#00a884] rounded border">{btn.text || "زر"}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : templateType === "PRODUCT_CAROUSEL" ? (
                                    <div className="space-y-2">
                                        <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%]">
                                            <p className="text-sm whitespace-pre-wrap">{bodyText || "رسالة المنتجات..."}</p>
                                        </div>
                                        {/* Product Carousel Preview */}
                                        <div className="flex overflow-x-auto gap-2 pb-2 -mx-3 px-3">
                                            {productCarouselCards.length > 0 ? (
                                                productCarouselCards.map((card, i) => (
                                                    <div key={i} className="bg-white dark:bg-[#202c33] rounded-lg shadow-sm min-w-[200px] max-w-[200px] overflow-hidden shrink-0">
                                                        <div className="h-24 bg-gray-200 flex items-center justify-center">
                                                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                        <div className="p-2">
                                                            <p className="text-xs text-muted-foreground font-mono">{card.productId || "Product ID"}</p>
                                                            {card.bodyText && (
                                                                <p className="text-sm mt-1">{card.bodyText}</p>
                                                            )}
                                                            <div className="mt-2">
                                                                <div className="bg-gray-50 p-1 text-center text-xs text-[#00a884] rounded border">
                                                                    {card.buttonType === "VIEW" ? "عرض" : "رابط"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center text-muted-foreground text-sm p-4">
                                                    اختر المنتجات للمعاينة
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : templateType === "CATALOG" ? (
                                    <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg rounded-tl-none shadow-sm max-w-[90%] mb-2">
                                        {catalogHeaderPreviewUrl && (
                                            <div className="mb-2">
                                                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32 flex items-center justify-center overflow-hidden">
                                                    <img src={catalogHeaderPreviewUrl} className="w-full h-full object-cover" />
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{catalogBodyText || "عرض كتالوجنا..."}</p>
                                        {footerText && <p className="text-[10px] text-gray-500 mt-2">{footerText}</p>}
                                        <div className="border-t mt-2 pt-2">
                                            <div className="text-center text-sm text-[#00a884] font-medium py-1">عرض الكتالوج</div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}