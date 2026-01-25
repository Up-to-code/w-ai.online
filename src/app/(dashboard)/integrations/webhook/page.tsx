"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useUserQuery } from "@/hooks/useUserQuery"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUserContext } from "@/hooks/useUserContext"
import { useOrganizationContext } from "@/hooks/useOrganizationContext"
import {
    ArrowLeft,
    Eye,
    EyeOff,
    Copy,
    Plus,
    X,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    Webhook,
    Key,
    Phone,
    Building2,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Send,
    Settings,
} from "lucide-react"
import { toast } from "sonner"

const STEPS = [
    { id: 1, title: "Access Token", description: "Enter your Meta Access Token" },
    { id: 2, title: "Phone Numbers", description: "Add phone numbers with details" },
    { id: 3, title: "Save", description: "Save configuration" },
    { id: 4, title: "Webhook URL", description: "Copy webhook URL and token" },
    { id: 5, title: "Verification", description: "Verify with Meta" },
    { id: 6, title: "Complete", description: "Ready to use" },
]

interface PhoneNumberData {
    businessName: string
    phoneNumberId: string
    wabaId: string
}

export default function WebhookConfigurationPage() {
    const router = useRouter()
    const { userId } = useUserContext()
    const { currentOrganization } = useOrganizationContext()
    const organizationId = currentOrganization?._id
    const organizationSlug = currentOrganization?.slug
    
    const connectMetaManually = useAction(api.meta.connectManually)
    const updatePhoneNumberLookupForAll = useAction(api.meta.updatePhoneNumberLookupForAll)
    const sendTestMessage = useAction(api.whatsapp.sendMessage)
    const metaConnection = useUserQuery(api.meta.getConnection, {})
    const webhooks = useQuery(api.webhooks.listWebhooks, organizationId ? { organizationId } : "skip")
    const verificationStatus = useQuery(api.webhooks.getWebhookVerificationStatus, organizationId ? { organizationId } : "skip")
    const createWebhook = useMutation(api.webhooks.createWebhook)
    const updateWebhook = useMutation(api.webhooks.updateWebhook)
    const vaultEnvVars = useQuery(api.vault.getOrganizationEnvVars, organizationId ? { organizationId } : "skip")
    
    const existingWebhook = webhooks && webhooks.length > 0 ? webhooks[0] : null

    const [currentStep, setCurrentStep] = useState(1)
    const [isSaving, setIsSaving] = useState(false)
    const [isSavingStep, setIsSavingStep] = useState<number | null>(null)
    const [showAccessToken, setShowAccessToken] = useState(false)
    const [showVerifyToken, setShowVerifyToken] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testPhone, setTestPhone] = useState("")
    const [phoneError, setPhoneError] = useState<string | null>(null)
    const [isSendingTest, setIsSendingTest] = useState(false)
    
    const [accessToken, setAccessToken] = useState("")
    const [wabaId, setWabaId] = useState("")
    const [appId, setAppId] = useState("")
    const [verifyToken, setVerifyToken] = useState("")
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberData[]>([{
        businessName: "",
        phoneNumberId: "",
        wabaId: "",
    }])

    // Get webhook URL with organization slug
    const getWebhookUrl = () => {
        if (!organizationSlug) return "https://your-deployment.convex.site/whatsapp/webhook"
        
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || ""
        if (convexUrl.includes("convex.cloud")) {
            const match = convexUrl.match(/https:\/\/([^.]+)\.convex\.cloud/)
            if (match && match[1]) {
                return `https://${match[1]}.convex.site/whatsapp/webhook/${organizationSlug}`
            }
        }
        return `https://your-deployment.convex.site/whatsapp/webhook/${organizationSlug}`
    }

    const webhookUrl = getWebhookUrl()

    // Phone number formatting function
    const formatPhoneNumber = (value: string): string => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');
        
        // Format based on length
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        // For longer numbers (with country code)
        if (digits.startsWith('966')) {
            // Saudi format: 966 XX XXX XXXX
            if (digits.length <= 12) {
                return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
            }
        }
        // International: group by 3 digits
        return digits.replace(/(\d{3})(?=\d)/g, '$1 ');
    };

    // Phone number validation function
    const validatePhoneNumber = (phone: string): string | null => {
        const digits = phone.replace(/\D/g, '');
        if (!digits || digits.length < 7) {
            return "رقم الهاتف قصير جداً. يجب أن يحتوي على 7 أرقام على الأقل";
        }
        if (digits.length > 15) {
            return "رقم الهاتف طويل جداً. الحد الأقصى 15 رقم";
        }
        return null; // Valid
    };

    // Handle phone number input change with formatting and validation
    const handlePhoneChange = (value: string) => {
        const formatted = formatPhoneNumber(value);
        setTestPhone(formatted);
        
        // Validate and set error
        const error = validatePhoneNumber(formatted);
        setPhoneError(error);
    };

    // Load existing data if connected (edit mode)
    useEffect(() => {
        if (metaConnection?.connected && existingWebhook) {
            // Load phone numbers
            if (existingWebhook.phoneNumbers && existingWebhook.phoneNumbers.length > 0) {
                setPhoneNumbers(existingWebhook.phoneNumbers)
            } else if (existingWebhook.phoneNumberIds && existingWebhook.phoneNumberIds.length > 0) {
                setPhoneNumbers(existingWebhook.phoneNumberIds.map((id: string) => ({
                    phoneNumberId: id,
                    businessName: "",
                    wabaId: existingWebhook.wabaId || "",
                })))
            }
            
            // Load App ID
            if (existingWebhook.appId) setAppId(existingWebhook.appId)
            
            // Load verify token from webhook first, then fallback to vault
            if (existingWebhook.verifyToken) {
                setVerifyToken(existingWebhook.verifyToken)
            } else if (vaultEnvVars?.META_WEBHOOK_VERIFY_TOKEN) {
                setVerifyToken(vaultEnvVars.META_WEBHOOK_VERIFY_TOKEN)
            }
            
            // Load WABA ID from vault if available (for display/validation)
            if (vaultEnvVars?.META_WABA_ID && phoneNumbers.length > 0 && !phoneNumbers[0].wabaId) {
                setPhoneNumbers(prev => prev.map((p, i) => 
                    i === 0 ? { ...p, wabaId: vaultEnvVars.META_WABA_ID } : p
                ))
            }
            
            // Note: Access token is stored encrypted and not loaded for security reasons
            // User will need to re-enter it if they want to update it
            
            // Determine starting step
            if (existingWebhook.isVerified) {
                setCurrentStep(6)
            } else if (existingWebhook.verifyToken || vaultEnvVars?.META_WEBHOOK_VERIFY_TOKEN) {
                setCurrentStep(4) // Go to webhook URL step
            } else if (existingWebhook.phoneNumbers && existingWebhook.phoneNumbers.length > 0) {
                setCurrentStep(3) // Go to save step
            } else if (accessToken) {
                setCurrentStep(2) // Go to phone numbers step
            }
        } else if (vaultEnvVars?.META_WEBHOOK_VERIFY_TOKEN && !verifyToken) {
            // Load verify token from vault if no webhook exists
            setVerifyToken(vaultEnvVars.META_WEBHOOK_VERIFY_TOKEN)
        }
    }, [metaConnection, existingWebhook, vaultEnvVars])

    // Auto-advance when verification succeeds
    useEffect(() => {
        if (verificationStatus?.isVerified && currentStep === 5) {
            setTimeout(() => {
                setCurrentStep(6)
                toast.success("تم التحقق من Webhook بنجاح!")
            }, 1000)
        }
    }, [verificationStatus?.isVerified, currentStep])

    const handleAddPhoneNumber = () => {
        setPhoneNumbers([...phoneNumbers, {
            businessName: "",
            phoneNumberId: "",
            wabaId: "",
        }])
    }

    const handleRemovePhoneNumber = (index: number) => {
        if (phoneNumbers.length > 1) {
            setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index))
        }
    }

    // Validate numeric ID format (for Phone Number ID, WABA ID, App ID)
    const validateNumericId = (id: string, fieldName: string): string | null => {
        if (!id.trim()) {
            return null; // Empty is handled by required validation
        }
        // Should be numeric only
        if (!/^\d+$/.test(id.trim())) {
            return `${fieldName} يجب أن يحتوي على أرقام فقط`;
        }
        // Should be reasonable length (Meta IDs are typically 15-18 digits)
        if (id.trim().length < 10) {
            return `${fieldName} قصير جداً. يجب أن يحتوي على 10 أرقام على الأقل`;
        }
        if (id.trim().length > 20) {
            return `${fieldName} طويل جداً. الحد الأقصى 20 رقم`;
        }
        return null; // Valid
    };

    const handlePhoneNumberChange = (index: number, field: keyof PhoneNumberData, value: string) => {
        const updated = [...phoneNumbers]
        // For numeric fields, only allow digits
        if (field === "phoneNumberId" || field === "wabaId") {
            // Only allow digits
            const digitsOnly = value.replace(/\D/g, '');
            updated[index] = { ...updated[index], [field]: digitsOnly }
        } else {
            updated[index] = { ...updated[index], [field]: value }
        }
        setPhoneNumbers(updated)
        
        // Clear error when user starts typing
        if (error && error.includes("أرقام الهواتف")) {
            setError(null)
        }
    }

    // Handle App ID change with validation
    const handleAppIdChange = (value: string) => {
        // Only allow digits
        const digitsOnly = value.replace(/\D/g, '');
        setAppId(digitsOnly)
        
        // Clear error when user starts typing
        if (error && error.includes("App ID")) {
            setError(null)
        }
    }

    const handleCopyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl)
        toast.success("تم نسخ رابط Webhook")
    }

    const handleCopyVerifyToken = () => {
        navigator.clipboard.writeText(verifyToken)
        toast.success("تم نسخ Verify Token")
    }

    const handleSendTestMessage = async () => {
        if (!userId) {
            toast.error("يجب تسجيل الدخول أولاً")
            return
        }
        
        if (!organizationId) {
            toast.error("يجب إنشاء منظمة أولاً")
            return
        }

        // Get cleaned phone number (digits only)
        const phoneDigits = testPhone.replace(/\D/g, '');
        
        // Validate phone number format
        if (!phoneDigits) {
            setPhoneError("أدخل رقم هاتف للاختبار")
            toast.error("أدخل رقم هاتف للاختبار (مثال: 966501234567)")
            return
        }

        const validationError = validatePhoneNumber(phoneDigits);
        if (validationError) {
            setPhoneError(validationError);
            toast.error(validationError);
            return
        }

        // Clear any previous errors
        setPhoneError(null);
        setIsSendingTest(true)
        
        try {
            await sendTestMessage({
                organizationId, // Organization-scoped
                to: phoneDigits, // Send only digits
                type: "text",
                content: { body: "مرحباً، هذه رسالة تجريبية من إعدادات Webhook." },
            })
            toast.success("تم إرسال الرسالة التجريبية")
            setTestPhone("")
            setPhoneError(null)
        } catch (e: unknown) {
            const err = e as Error & { code?: number; category?: string }
            let msg = err instanceof Error ? err.message : "فشل إرسال الرسالة التجريبية"
            
            // Handle phone number format errors
            if (msg.includes("Invalid phone number format") || msg.includes("phone number")) {
                setPhoneError("تنسيق رقم الهاتف غير صحيح. يجب أن يحتوي على 7-15 رقم")
                toast.error("تنسيق رقم الهاتف غير صحيح. يجب أن يحتوي على 7-15 رقم")
                return
            }
            
            // Special handling for phone not in allowed list error (131030)
            if (err.code === 131030 || err.category === "PHONE_NOT_ALLOWED" || msg.includes("131030") || msg.includes("not in allowed list")) {
                toast.error(msg, {
                    duration: 8000,
                    description: "يجب إضافة رقم الهاتف إلى قائمة الأرقام المسموحة في Meta Developer Console قبل إرسال الرسائل في وضع الاختبار.",
                })
            } else if (msg.includes("Webhook غير مُتحقق منه")) {
                toast.error(msg, {
                    duration: 6000,
                    description: "يرجى التحقق من Webhook في Meta Developer Console أولاً.",
                })
            } else if (msg.includes("Meta WhatsApp not connected")) {
                toast.error("Meta WhatsApp غير متصل", {
                    duration: 6000,
                    description: "يرجى الاتصال بـ Meta WhatsApp في الإعدادات أولاً.",
                })
            } else {
                toast.error(msg, {
                    duration: 5000,
                })
            }
        } finally {
            setIsSendingTest(false)
        }
    }

    // Retry wrapper for connection errors
    const retryAction = async <T,>(
        actionFn: () => Promise<T>,
        maxRetries = 3,
        delayMs = 1000
    ): Promise<T> => {
        let lastError: any;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await actionFn();
            } catch (error: any) {
                lastError = error;
                const errorMessage = error?.message || "";
                const isConnectionError = 
                    errorMessage.includes("Connection lost") ||
                    errorMessage.includes("connection") ||
                    errorMessage.includes("Connection") ||
                    error?.name === "ConvexError" ||
                    errorMessage.includes("in flight");
                
                if (isConnectionError && attempt < maxRetries) {
                    const waitTime = delayMs * Math.pow(2, attempt - 1);
                    toast.info(`فقد الاتصال بالخادم. جاري إعادة المحاولة... (${attempt}/${maxRetries})`, {
                        duration: waitTime,
                    });
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    }

    // Save Step 1 data (Access Token)
    const saveStep1Data = async (): Promise<boolean> => {
        if (!userId) {
            setError("يجب تسجيل الدخول أولاً")
            return false
        }

        // In edit mode, access token is optional (can keep existing)
        // In create mode, access token is required
        if (!isConnected && !accessToken.trim()) {
            setError("يرجى إدخال Access Token")
            return false
        }

        setIsSavingStep(1)
        setError(null)

        try {
            // Access token is saved via connectManually in handleSave
            // This step just validates and moves forward
            if (isConnected && !accessToken.trim()) {
                toast.success("سيتم الاحتفاظ بـ Access Token الحالي")
            } else {
                toast.success("تم التحقق من Access Token")
            }
            return true
        } catch (err: any) {
            console.error("Save Step 1 error:", err)
            const errorMessage = err?.message || "فشل التحقق من Access Token. يرجى المحاولة مرة أخرى."
            setError(errorMessage)
            toast.error(errorMessage)
            return false
        } finally {
            setIsSavingStep(null)
        }
    }

    // Save Step 2 data (App ID and Verify Token)
    const saveStep2Data = async (): Promise<boolean> => {
        if (!userId || !organizationId) {
            setError("يجب تسجيل الدخول وإنشاء منظمة أولاً")
            return false
        }

        // Validate App ID
        if (!appId.trim()) {
            setError("يرجى إدخال App ID")
            return false
        }

        // Validate phone numbers
        if (phoneNumbers.length === 0) {
            setError("يرجى إضافة رقم هاتف واحد على الأقل")
            return false
        }

        const emptyPhones = phoneNumbers.some(phone => 
            !phone.phoneNumberId.trim() || 
            !phone.businessName.trim() || 
            !phone.wabaId.trim()
        )
        if (emptyPhones) {
            setError("يرجى ملء جميع حقول أرقام الهواتف (اسم العمل، Phone Number ID، WhatsApp Business Account ID)")
            return false
        }

        // Generate verify token if not set
        let finalVerifyToken = verifyToken
        if (!finalVerifyToken || !finalVerifyToken.trim()) {
            finalVerifyToken = `wh_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
            setVerifyToken(finalVerifyToken)
        }

        setIsSavingStep(2)
        setError(null)

        try {
            // App ID and Verify Token are saved via connectManually in handleSave
            // This step just validates and moves forward
            toast.success("تم التحقق من App ID و Verify Token")
            return true
        } catch (err: any) {
            console.error("Save Step 2 error:", err)
            const errorMessage = err?.message || "فشل حفظ البيانات. يرجى المحاولة مرة أخرى."
            setError(errorMessage)
            toast.error(errorMessage)
            return false
        } finally {
            setIsSavingStep(null)
        }
    }

    const handleSave = async () => {
        if (!userId || !organizationId) {
            setError("يجب تسجيل الدخول وإنشاء منظمة أولاً")
            return
        }

        // Validation - access token required for new connections, optional for editing
        if (!isConnected && !accessToken.trim()) {
            setError("يرجى إدخال Access Token")
            return
        }

        if (phoneNumbers.length === 0) {
            setError("يرجى إضافة رقم هاتف واحد على الأقل")
            return
        }

        // Validate all phone numbers are filled
        const emptyPhones = phoneNumbers.some(phone => 
            !phone.phoneNumberId.trim() || 
            !phone.businessName.trim() || 
            !phone.wabaId.trim()
        )
        if (emptyPhones) {
            setError("يرجى ملء جميع حقول أرقام الهواتف (اسم العمل، Phone Number ID، WhatsApp Business Account ID)")
            return
        }

        // Validate phone number IDs format
        const invalidPhoneNumberIds = phoneNumbers.some(phone => {
            const error = validateNumericId(phone.phoneNumberId, "Phone Number ID");
            return error !== null;
        });
        if (invalidPhoneNumberIds) {
            setError("Phone Number ID يجب أن يحتوي على أرقام فقط (10-20 رقم)")
            return
        }

        // Validate WABA IDs format
        const invalidWabaIds = phoneNumbers.some(phone => {
            const error = validateNumericId(phone.wabaId, "WhatsApp Business Account ID");
            return error !== null;
        });
        if (invalidWabaIds) {
            setError("WhatsApp Business Account ID يجب أن يحتوي على أرقام فقط (10-20 رقم)")
            return
        }

        // Validate App ID is filled and format
        if (!appId.trim()) {
            setError("يرجى إدخال App ID")
            return
        }
        const appIdError = validateNumericId(appId, "App ID");
        if (appIdError) {
            setError(appIdError)
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            // Retrieve verify token from vault to ensure consistency
            const vaultVerifyToken = vaultEnvVars?.META_WEBHOOK_VERIFY_TOKEN?.trim()
            const stateVerifyToken = verifyToken?.trim()
            
            // Use vault token if available, otherwise use state token, otherwise generate new
            let finalVerifyToken = vaultVerifyToken || stateVerifyToken
            if (!finalVerifyToken) {
                finalVerifyToken = `wh_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
                setVerifyToken(finalVerifyToken)
            } else if (vaultVerifyToken && vaultVerifyToken !== stateVerifyToken) {
                // Update state to match vault
                setVerifyToken(vaultVerifyToken)
            }

            console.log("[Webhook Save] Using verify token:", {
                fromVault: !!vaultVerifyToken,
                fromState: !!stateVerifyToken,
                finalToken: finalVerifyToken.substring(0, 10) + "...",
                tokensMatch: vaultVerifyToken === stateVerifyToken
            })

            // Use first phone's WABA ID for main connection (backward compatibility)
            const firstPhoneWabaId = phoneNumbers[0].wabaId

            // 1. Connect Meta (stores credentials in encrypted storage) with retry logic
            // Only call if access token is provided (new connection or updating credentials)
            if (accessToken.trim()) {
                try {
                    await retryAction(async () => {
                        return await connectMetaManually({
                            userId,
                            organizationId, // Organization-scoped
                            accessToken,
                            phoneNumberId: phoneNumbers[0].phoneNumberId, // Use first phone number for main connection
                            wabaId: firstPhoneWabaId, // Use first phone's WABA ID
                            appId,
                            webhookVerifyToken: finalVerifyToken, // Use the consistent token
                        })
                    }, 3, 1000)
                } catch (connectError: any) {
                console.error("Connect Meta error:", connectError)
                let connectErrorMessage = "فشل الاتصال بـ Meta. يرجى التحقق من بيانات API."
                
                if (connectError.message) {
                    const errorMsg = connectError.message.toLowerCase();
                    
                    // Connection errors
                    if (errorMsg.includes("connection lost") || errorMsg.includes("connection") || errorMsg.includes("in flight")) {
                        connectErrorMessage = "فشل الاتصال بعد عدة محاولات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
                    } 
                    // Network errors
                    else if (errorMsg.includes("network") || errorMsg.includes("timeout") || errorMsg.includes("fetch")) {
                        connectErrorMessage = "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
                    }
                    // Validation errors
                    else if (errorMsg.includes("failed to validate") || errorMsg.includes("validation failed")) {
                        connectErrorMessage = "فشل التحقق من بيانات Meta. يرجى التأكد من صحة Access Token و WABA ID و Phone Number ID."
                    } 
                    // Not found errors
                    else if (errorMsg.includes("not found") || errorMsg.includes("doesn't belong")) {
                        connectErrorMessage = "Phone Number ID غير موجود أو لا ينتمي إلى WABA المحدد."
                    } 
                    // WABA validation errors
                    else if (errorMsg.includes("waba id validation failed")) {
                        connectErrorMessage = "WABA ID غير صحيح. يرجى التحقق من WABA ID."
                    } 
                    // Connection failed errors
                    else if (errorMsg.includes("connection failed")) {
                        connectErrorMessage = "فشل الاتصال بالخادم. يرجى المحاولة مرة أخرى."
                    }
                    // Other errors
                    else {
                        connectErrorMessage = connectError.message
                    }
                }
                
                throw new Error(connectErrorMessage)
                }
            } else if (isConnected && !accessToken.trim()) {
                // In edit mode without new access token, just update webhook config
                // Credentials remain unchanged
                console.log("[Webhook Save] Edit mode: Keeping existing credentials, updating webhook config only")
            }

            // 2. Create or update webhook configuration
            const webhookName = "WhatsApp Business Webhook"
            const baseWebhookUrl = getWebhookUrl()

            try {
                if (existingWebhook) {
                    // Update existing webhook
                    await updateWebhook({
                        webhookId: existingWebhook._id,
                        organizationId, // Organization-scoped
                        verifyToken: finalVerifyToken, // Use the consistent token
                        wabaId: firstPhoneWabaId, // Use first phone's WABA ID for backward compatibility
                        appId,
                        phoneNumbers: phoneNumbers,
                        phoneNumberIds: phoneNumbers.map(p => p.phoneNumberId),
                    })
                } else {
                    // Create new webhook
                    await createWebhook({
                        organizationId, // Organization-scoped
                        name: webhookName,
                        webhookUrl: baseWebhookUrl,
                        verifyToken: finalVerifyToken, // Use the consistent token
                        phoneNumbers: phoneNumbers,
                        phoneNumberIds: phoneNumbers.map(p => p.phoneNumberId),
                        wabaId: firstPhoneWabaId, // Use first phone's WABA ID for backward compatibility
                        appId,
                    })
                }
            } catch (webhookError: any) {
                console.error("Webhook create/update error:", webhookError)
                let webhookErrorMessage = "فشل حفظ إعدادات Webhook."
                
                if (webhookError.message) {
                    if (webhookError.message.includes("ArgumentValidationError") || webhookError.message.includes("validation")) {
                        webhookErrorMessage = "خطأ في التحقق من بيانات Webhook. يرجى التأكد من ملء جميع الحقول المطلوبة."
                    } else if (webhookError.message.includes("not found") || webhookError.message.includes("access denied")) {
                        webhookErrorMessage = "Webhook غير موجود أو ليس لديك صلاحية للوصول إليه."
                    } else {
                        webhookErrorMessage = webhookError.message
                    }
                }
                
                throw new Error(webhookErrorMessage)
            }

            // 3. Update lookup table for all phone numbers
            try {
                await updatePhoneNumberLookupForAll({
                    userId,
                    phoneNumberIds: phoneNumbers.map(p => p.phoneNumberId),
                })
            } catch (lookupError: any) {
                console.error("Lookup update error:", lookupError)
                // Non-critical error, log but don't fail the whole operation
                console.warn("Failed to update phone number lookup table, but webhook was saved successfully")
            }

            toast.success("تم حفظ الإعدادات بنجاح!")
            setCurrentStep(4) // Move to webhook URL step
        } catch (err: any) {
            console.error("Save error:", err)
            
            // Handle specific error types with user-friendly messages
            let errorMessage = "فشل حفظ الإعدادات. يرجى التحقق من البيانات المدخلة."
            
            if (err.message) {
                const errorMsg = err.message.toLowerCase();
                
                // Connection errors
                if (errorMsg.includes("connection lost") || errorMsg.includes("connection") || errorMsg.includes("in flight")) {
                    errorMessage = "فشل الاتصال بعد عدة محاولات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
                }
                // Network errors
                else if (errorMsg.includes("network") || errorMsg.includes("timeout") || errorMsg.includes("fetch")) {
                    errorMessage = "خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى."
                }
                // Validation errors
                else if (errorMsg.includes("argumentvalidationerror") || errorMsg.includes("validation")) {
                    errorMessage = "خطأ في التحقق من البيانات. يرجى التأكد من ملء جميع الحقول المطلوبة بشكل صحيح."
                } 
                // Meta validation errors
                else if (errorMsg.includes("failed to validate") || errorMsg.includes("validation failed")) {
                    errorMessage = "فشل التحقق من بيانات Meta. يرجى التأكد من صحة Access Token و WABA ID و Phone Number ID."
                } 
                // Not found errors
                else if (errorMsg.includes("not found") || errorMsg.includes("غير موجود")) {
                    errorMessage = "لم يتم العثور على البيانات المطلوبة. يرجى المحاولة مرة أخرى."
                } 
                // Access denied errors
                else if (errorMsg.includes("access denied") || errorMsg.includes("غير مصرح")) {
                    errorMessage = "ليس لديك صلاحية للوصول إلى هذا المورد."
                } 
                // Other errors - use the error message as-is
                else {
                    errorMessage = err.message
                }
            }
            
            setError(errorMessage)
            toast.error(errorMessage, {
                duration: 5000,
            })
        } finally {
            setIsSaving(false)
        }
    }

    const isConnected = metaConnection?.connected || !!existingWebhook
    const progress = ((currentStep - 1) / (STEPS.length - 1)) * 100

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1 flex flex-wrap items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-foreground">إعدادات Webhook</h1>
                            {isConnected && (
                                <Badge variant="outline" className="gap-1 text-xs">
                                    <Settings className="h-3 w-3" /> تعديل الإعدادات
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mt-1">
                            {isConnected 
                                ? "تعديل إعدادات Webhook الحالية لـ WhatsApp Business API"
                                : "تكوين Webhook جديد لـ WhatsApp Business API"
                            }
                        </p>
                    </div>
                    {isConnected && (
                        <Badge className="bg-success text-success-foreground gap-1 shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> متصل
                        </Badge>
                    )}
                </div>
            </div>

            {/* Edit Mode Info Card */}
            {isConnected && existingWebhook && (
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                <Settings className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <p className="text-sm font-medium text-foreground">
                                    أنت تقوم بتعديل إعدادات Webhook الحالية
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    سيتم تحديث الإعدادات الحالية عند الحفظ. إذا كنت تريد تحديث Access Token، يرجى إدخاله في الخطوة الأولى.
                                </p>
                                {existingWebhook.isVerified && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <CheckCircle2 className="h-4 w-4 text-success" />
                                        <span className="text-xs text-success font-medium">Webhook مُتحقق منه</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Progress Indicator */}
            <Card className="border-2">
                <CardContent className="p-6">
                    <div className="space-y-5">
                        <Progress value={progress} className="h-2.5" />
                        <div className="flex justify-between items-center overflow-x-auto pb-2">
                            {STEPS.map((step, index) => (
                                <div key={step.id} className="flex items-center gap-3 min-w-fit">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 transition-all ${
                                        currentStep > step.id 
                                            ? "bg-success border-success text-white shadow-sm" 
                                            : currentStep === step.id
                                            ? "border-[#128C7E] bg-[#128C7E] text-white shadow-md scale-105"
                                            : "border-muted bg-background text-muted-foreground"
                                    }`}>
                                        {currentStep > step.id ? (
                                            <CheckCircle className="h-5 w-5" />
                                        ) : (
                                            <span className="text-sm font-semibold">{step.id}</span>
                                        )}
                                    </div>
                                    <div className="hidden sm:block min-w-[120px]">
                                        <p className={`text-sm font-semibold whitespace-nowrap ${
                                            currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                                        }`}>
                                            {step.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">{step.description}</p>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block mx-3 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step 1: Access Token */}
            {currentStep === 1 && (
                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#128C7E] flex items-center justify-center shadow-md">
                                <Key className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Access Token</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                    أدخل Access Token من Meta Developer Console
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        {isConnected && (
                            <div className="p-3 bg-info/10 border border-info/20 rounded-lg text-sm">
                                <p className="text-info font-medium mb-1">ملاحظة:</p>
                                <p className="text-muted-foreground">
                                    Access Token الحالي محفوظ بشكل آمن. إذا كنت تريد تحديثه، أدخل Access Token الجديد هنا. إذا لم تكن تريد تغييره، اترك الحقل فارغاً وسيتم استخدام القيمة الحالية.
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="accessToken" className="flex items-center gap-2">
                                <Key className="h-4 w-4" />
                                Access Token {isConnected ? "(اختياري للتحديث)" : "*"}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="accessToken"
                                    type={showAccessToken ? "text" : "password"}
                                    placeholder={isConnected ? "اتركه فارغاً للاحتفاظ بالقيمة الحالية أو أدخل Access Token جديد" : "أدخل Access Token من Meta Developer"}
                                    value={accessToken}
                                    onChange={(e) => setAccessToken(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAccessToken(!showAccessToken)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showAccessToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <Button
                            onClick={async () => {
                                const saved = await saveStep1Data()
                                if (saved) {
                                    setCurrentStep(2)
                                }
                            }}
                            disabled={isSavingStep === 1}
                            className="w-full gap-2 bg-[#128C7E] hover:bg-[#0F7A6D]"
                            size="lg"
                        >
                            {isSavingStep === 1 ? (
                                <>
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    التالي
                                    <ChevronLeft className="h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Phone Numbers */}
            {currentStep === 2 && (
                <Card className="border-2 shadow-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-[#128C7E] flex items-center justify-center shadow-md">
                                <Phone className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Phone Numbers</CardTitle>
                                <CardDescription className="text-sm mt-1">
                                    أضف أرقام الهواتف مع التفاصيل
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-2">
                        {/* App ID (Global) */}
                        <div className="space-y-2">
                            <Label htmlFor="appId" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                App ID *
                            </Label>
                            <Input
                                id="appId"
                                type="text"
                                placeholder="أدخل App ID (أرقام فقط)"
                                value={appId}
                                onChange={(e) => handleAppIdChange(e.target.value)}
                                className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                                App ID المشترك لجميع أرقام الهواتف
                            </p>
                        </div>

                        {/* Phone Numbers List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center gap-2 text-base font-semibold">
                                    <Phone className="h-5 w-5" />
                                    Phone Numbers *
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddPhoneNumber}
                                    className="gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    إضافة رقم
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {phoneNumbers.map((phone, index) => (
                                    <Card key={index} className="border-2 p-5 space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#128C7E]/10 flex items-center justify-center">
                                                    <Phone className="h-4 w-4 text-[#128C7E]" />
                                                </div>
                                                <Label className="text-base font-semibold">Phone Number {index + 1}</Label>
                                            </div>
                                            {phoneNumbers.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemovePhoneNumber(index)}
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-4">
                                            {/* Business Name */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                    Business Name *
                                                </Label>
                                                <Input
                                                    placeholder="اسم العمل"
                                                    value={phone.businessName}
                                                    onChange={(e) => handlePhoneNumberChange(index, "businessName", e.target.value)}
                                                    className="h-10"
                                                />
                                            </div>

                                            {/* Phone Number ID */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                    Phone Number ID *
                                                </Label>
                                                <Input
                                                    placeholder="415634904969622"
                                                    value={phone.phoneNumberId}
                                                    onChange={(e) => handlePhoneNumberChange(index, "phoneNumberId", e.target.value)}
                                                    className="font-mono text-sm h-10"
                                                />
                                            </div>

                                            {/* WhatsApp Business Account ID */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium flex items-center gap-2">
                                                    <Building2 className="h-4 w-4" />
                                                    WhatsApp Business Account ID *
                                                </Label>
                                                <Input
                                                    placeholder="405502635982104"
                                                    value={phone.wabaId}
                                                    onChange={(e) => handlePhoneNumberChange(index, "wabaId", e.target.value)}
                                                    className="font-mono text-sm h-10"
                                                />
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(1)}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4" />
                                رجوع
                            </Button>
                            <Button
                                onClick={async () => {
                                    const saved = await saveStep2Data()
                                    if (saved) {
                                        setCurrentStep(3)
                                    }
                                }}
                                disabled={isSavingStep === 2}
                                className="flex-1 gap-2 bg-[#128C7E] hover:bg-[#0F7A6D]"
                                size="lg"
                            >
                                {isSavingStep === 2 ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        التالي
                                        <ChevronLeft className="h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Save */}
            {currentStep === 3 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#128C7E] flex items-center justify-center">
                                <Save className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle>Save Configuration</CardTitle>
                                <CardDescription>
                                    حفظ الإعدادات والتكوين
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <p className="text-sm font-medium">ملخص الإعدادات:</p>
                            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside rtl:text-right">
                                <li>Access Token: {accessToken ? "✓ تم الإدخال" : "✗ غير موجود"}</li>
                                <li>App ID: {appId || "غير محدد"}</li>
                                <li>Phone Numbers: {phoneNumbers.length} رقم</li>
                                {phoneNumbers.length > 0 && phoneNumbers[0].wabaId && (
                                    <li>WhatsApp Business Account ID: {phoneNumbers[0].wabaId}</li>
                                )}
                            </ul>
                        </div>

                        {error && (
                            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(2)}
                                className="gap-2"
                                disabled={isSaving}
                            >
                                <ChevronRight className="h-4 w-4" />
                                رجوع
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1 gap-2 bg-[#128C7E] hover:bg-[#0F7A6D]"
                                size="lg"
                            >
                                {isSaving ? (
                                    <>
                                        <RefreshCw className="h-5 w-5 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        حفظ الإعدادات
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 4: Webhook URL & Token */}
            {currentStep === 4 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#128C7E] flex items-center justify-center">
                                <Webhook className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle>Webhook URL & Token</CardTitle>
                                <CardDescription>
                                    انسخ Webhook URL و Verify Token لإعدادات Meta
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Webhook URL */}
                        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Webhook URL</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyWebhookUrl}
                                    className="gap-2"
                                >
                                    <Copy className="h-4 w-4" />
                                    نسخ
                                </Button>
                            </div>
                            <div className="p-3 bg-background rounded border font-mono text-xs break-all">
                                {webhookUrl}
                            </div>
                        </div>

                        {/* Verify Token */}
                        <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Verify Token *</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCopyVerifyToken}
                                    className="gap-2"
                                    disabled={!verifyToken || !verifyToken.trim()}
                                >
                                    <Copy className="h-4 w-4" />
                                    نسخ
                                </Button>
                            </div>
                            {verifyToken && verifyToken.trim() ? (
                                <div className="relative">
                                    <Input
                                        type={showVerifyToken ? "text" : "password"}
                                        value={verifyToken}
                                        readOnly
                                        className="font-mono text-sm pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowVerifyToken(!showVerifyToken)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showVerifyToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            ) : (
                                <div className="p-3 bg-warning/10 border border-warning/20 rounded text-sm text-warning">
                                    <AlertCircle className="h-4 w-4 inline mr-2" />
                                    Verify Token غير موجود. يرجى حفظ الإعدادات أولاً.
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                                استخدم هذا الرمز في إعدادات Meta Developer {'>'} Webhooks {'>'} Verify Token
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="space-y-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                            <h3 className="font-medium text-sm">خطوات الإعداد في Meta Developer Console:</h3>
                            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-2 rtl:text-right">
                                <li>اذهب إلى Meta Developer Console {'>'} تطبيقك {'>'} Webhooks</li>
                                <li>انسخ Webhook URL أعلاه والصقه في حقل Callback URL</li>
                                <li>انسخ Verify Token أعلاه والصقه في حقل Verify Token</li>
                                <li>اضغط على "Verify and Save"</li>
                            </ol>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(3)}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4" />
                                رجوع
                            </Button>
                            <Button
                                onClick={() => setCurrentStep(5)}
                                className="flex-1 gap-2 bg-[#128C7E] hover:bg-[#0F7A6D]"
                            >
                                متابعة للتحقق
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 5: Verification Status */}
            {currentStep === 5 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#128C7E] flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <CardTitle>Verification Status</CardTitle>
                                <CardDescription>
                                    حالة التحقق من Webhook
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {verificationStatus && (
                            <div className={`p-4 rounded-lg border-2 ${
                                verificationStatus.isVerified 
                                    ? "border-success/20 bg-success/5" 
                                    : "border-warning/20 bg-warning/5"
                            }`}>
                                <div className="flex items-center gap-3">
                                    {verificationStatus.isVerified ? (
                                        <CheckCircle2 className="h-5 w-5 text-success" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-warning" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className={`font-medium ${
                                                verificationStatus.isVerified ? "text-success" : "text-warning"
                                            }`}>
                                                {verificationStatus.isVerified ? "Webhook Verified" : "Webhook Not Verified"}
                                            </p>
                                            <Badge variant={verificationStatus.isVerified ? "default" : "secondary"} className={verificationStatus.isVerified ? "bg-success" : ""}>
                                                {verificationStatus.isVerified ? "Verified" : "Not Verified"}
                                            </Badge>
                                        </div>
                                        {verificationStatus.isVerified && verificationStatus.verifiedAt && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Verified on {new Date(verificationStatus.verifiedAt).toLocaleString('ar-SA')}
                                            </p>
                                        )}
                                        {!verificationStatus.isVerified && (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                يرجى التحقق من Webhook في Meta Developer Console أولاً
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(4)}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4" />
                                رجوع
                            </Button>
                            {verificationStatus?.isVerified ? (
                                <Button
                                    onClick={() => setCurrentStep(6)}
                                    className="flex-1 gap-2 bg-[#128C7E] hover:bg-[#0F7A6D]"
                                >
                                    متابعة
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(6)}
                                    className="flex-1 gap-2"
                                >
                                    تخطي الآن
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 6: Complete */}
            {currentStep === 6 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-success" />
                            </div>
                            <div>
                                <CardTitle>Complete</CardTitle>
                                <CardDescription>
                                    Webhook جاهز للاستخدام
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-success" />
                                <div>
                                    <p className="font-medium text-success">تم إعداد Webhook بنجاح!</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        يمكنك الآن استخدام WhatsApp Business API لإرسال الرسائل
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Cards */}
                        <div className="grid gap-3">
                            <div className={`p-4 rounded-lg border ${
                                isConnected ? "border-success/20 bg-success/5" : "border-muted bg-muted/50"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isConnected ? (
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm font-medium">Meta WhatsApp Business</span>
                                    </div>
                                    <Badge variant={isConnected ? "default" : "secondary"} className={isConnected ? "bg-success" : ""}>
                                        {isConnected ? "متصل" : "غير متصل"}
                                    </Badge>
                                </div>
                            </div>
                            <div className={`p-4 rounded-lg border ${
                                verificationStatus?.isVerified ? "border-success/20 bg-success/5" : "border-warning/20 bg-warning/5"
                            }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {verificationStatus?.isVerified ? (
                                            <CheckCircle2 className="h-4 w-4 text-success" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-warning" />
                                        )}
                                        <span className="text-sm font-medium">Webhook Verification</span>
                                    </div>
                                    <Badge variant={verificationStatus?.isVerified ? "default" : "secondary"} className={verificationStatus?.isVerified ? "bg-success" : ""}>
                                        {verificationStatus?.isVerified ? "Verified" : "Not Verified"}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Test as customer */}
                        {isConnected && (
                            <div className="p-4 rounded-lg border border-border space-y-3">
                                <div className="flex items-center gap-2">
                                    <Send className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">اختبار كعميل</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    أضف رقم هاتف (E.164، مثال: 966501234567) لاستقبال رسالة تجريبية.
                                </p>
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <div className="flex-1 text-xs text-blue-800 dark:text-blue-300">
                                        <p className="font-medium mb-1">ملاحظة مهمة:</p>
                                        <p>في وضع الاختبار (Test Mode)، يجب إضافة رقم الهاتف إلى قائمة الأرقام المسموحة في Meta Developer Console قبل إرسال الرسائل. اذهب إلى <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-medium">Meta Developer Console</a> → تطبيقك → WhatsApp → API Setup → أضف الرقم إلى "To" field.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="966 50 123 4567"
                                                value={testPhone}
                                                onChange={(e) => handlePhoneChange(e.target.value)}
                                                className={`font-mono ${phoneError ? "border-destructive" : ""}`}
                                                type="tel"
                                            />
                                            {phoneError && (
                                                <p className="text-sm text-destructive mt-1">{phoneError}</p>
                                            )}
                                            {!phoneError && testPhone && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    مثال: 966501234567 أو +966501234567
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleSendTestMessage}
                                            disabled={isSendingTest || !testPhone.trim() || !!phoneError}
                                            className="gap-2 shrink-0"
                                        >
                                            {isSendingTest ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Send className="h-4 w-4" />
                                            )}
                                            إرسال رسالة تجريبية
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(5)}
                                className="gap-2"
                            >
                                <ChevronRight className="h-4 w-4" />
                                رجوع
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentStep(1)}
                                className="gap-2"
                            >
                                <Settings className="h-4 w-4" />
                                تعديل الإعدادات
                            </Button>
                            <Button
                                onClick={() => router.push("/integrations")}
                                className="flex-1 gap-2 bg-[#128C7E] hover:bg-[#0F7A6D] min-w-[140px]"
                            >
                                الذهاب إلى التكاملات
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
