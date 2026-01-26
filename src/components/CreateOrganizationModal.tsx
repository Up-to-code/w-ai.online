"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUserContext } from "@/hooks/useUserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface CreateOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blocking?: boolean; // If true, modal cannot be closed (for required org creation)
}

export function CreateOrganizationModal({
  open,
  onOpenChange,
  blocking = false,
}: CreateOrganizationModalProps) {
  const { userId, user: appUser, workOSUser, isLoading: isUserLoading } = useUserContext();
  const createOrganization = useMutation(api.organizations.createOrganization);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [slugError, setSlugError] = useState<string>("");
  const [debouncedSlug, setDebouncedSlug] = useState("");
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper function to check if slug format is valid (without setting error)
  const validateSlugFormat = (slug: string): boolean => {
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    return slugRegex.test(slug);
  };

  // Check slug availability (only if valid format and debounced)
  const slugCheck = useQuery(
    api.organizations.getOrganizationBySlug,
    debouncedSlug && validateSlugFormat(debouncedSlug)
      ? { slug: debouncedSlug }
      : "skip"
  );

  // Debounce slug changes
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (formData.slug && validateSlugFormat(formData.slug)) {
      debounceTimeoutRef.current = setTimeout(() => {
        setDebouncedSlug(formData.slug);
      }, 500); // 500ms debounce
    } else {
      setDebouncedSlug("");
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [formData.slug]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({ name: "", slug: "" });
      setSlugError("");
      setDebouncedSlug("");
    }
  }, [open]);

  // Determine slug status
  const isCheckingSlug =
    debouncedSlug === formData.slug &&
    slugCheck === undefined &&
    formData.slug.length > 0;
  const isSlugAvailable =
    debouncedSlug === formData.slug &&
    slugCheck === null &&
    formData.slug.length > 0;
  const isSlugTaken =
    debouncedSlug === formData.slug &&
    slugCheck !== null &&
    slugCheck !== undefined;

  // Update slugError based on availability
  useEffect(() => {
    if (isSlugTaken) {
      setSlugError("هذا المعرف مستخدم بالفعل");
    } else if (isSlugAvailable) {
      // Clear availability error if slug becomes available, but keep format errors
      // Only clear if the current error is the availability error
      setSlugError((prev) =>
        prev === "هذا المعرف مستخدم بالفعل" ? "" : prev
      );
    }
  }, [isSlugTaken, isSlugAvailable]);

  const validateSlug = (slug: string): boolean => {
    // English characters, numbers, hyphens, underscores only
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slug.trim()) {
      setSlugError("المعرف مطلوب");
      return false;
    }
    if (!slugRegex.test(slug)) {
      setSlugError("يجب أن يحتوي المعرف على أحرف إنجليزية وأرقام فقط");
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    // Auto-convert to lowercase and remove spaces
    const cleaned = value.toLowerCase().replace(/\s+/g, "-");
    handleChange("slug", cleaned);
    if (cleaned) {
      validateSlug(cleaned);
    } else {
      setSlugError("");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    // Prevent default form submission if event is provided
    if (e) {
      e.preventDefault();
    }

    console.log("[CreateOrganizationModal] handleSubmit called", {
      userId,
      appUser,
      workOSUser,
      isUserLoading,
      name: formData.name,
      slug: formData.slug,
      isSubmitting,
      slugError,
      isCheckingSlug,
      isSlugTaken,
      isSlugAvailable,
    });

    // Check if user is still loading
    if (isUserLoading) {
      console.log("[CreateOrganizationModal] User is still loading");
      toast.error("جارٍ تحميل بيانات المستخدم، يرجى الانتظار...");
      return;
    }

    // Check if userId is missing
    if (!userId) {
      // If workOSUser exists but appUser is null, user doesn't exist in database
      if (workOSUser && appUser === null) {
        console.log("[CreateOrganizationModal] WorkOS user exists but app user is null - user not created in database");
        toast.error("لم يتم إنشاء حساب المستخدم بعد. يرجى المحاولة مرة أخرى أو تحديث الصفحة.");
        return;
      }
      // If workOSUser doesn't exist, user is not authenticated
      if (!workOSUser) {
        console.log("[CreateOrganizationModal] No WorkOS user - not authenticated");
        toast.error("يجب تسجيل الدخول أولاً");
        return;
      }
      // Otherwise, user is still loading or unknown state
      console.log("[CreateOrganizationModal] No userId - unknown state", { appUser, workOSUser });
      toast.error("خطأ في تحميل بيانات المستخدم. يرجى تحديث الصفحة والمحاولة مرة أخرى.");
      return;
    }

    if (!formData.name.trim()) {
      console.log("[CreateOrganizationModal] Name is empty");
      toast.error("اسم المنظمة مطلوب");
      return;
    }

    // Validate slug format and set error if invalid
    // This will update slugError state if validation fails
    const slugValid = validateSlug(formData.slug);
    if (!slugValid) {
      console.log("[CreateOrganizationModal] Slug validation failed", {
        slug: formData.slug,
        slugError,
      });
      // Error is already set by validateSlug, just return
      return;
    }

    // Ensure slug format is valid (double-check)
    if (!validateSlugFormat(formData.slug)) {
      console.log("[CreateOrganizationModal] Slug format invalid");
      setSlugError("يجب أن يحتوي المعرف على أحرف إنجليزية وأرقام فقط");
      return;
    }

    // Check if slug is taken (final check before submit)
    if (isSlugTaken) {
      console.log("[CreateOrganizationModal] Slug is taken");
      setSlugError("هذا المعرف مستخدم بالفعل");
      toast.error("هذا المعرف مستخدم بالفعل");
      return;
    }

    // If still checking, wait a bit
    if (isCheckingSlug) {
      console.log("[CreateOrganizationModal] Still checking slug");
      toast.error("يرجى الانتظار حتى يتم التحقق من المعرف");
      return;
    }

    // Additional check: if slug is not available and not taken, it might still be checking
    // This can happen if debounce hasn't completed yet
    if (
      !isSlugAvailable &&
      !isSlugTaken &&
      formData.slug.trim().length > 0 &&
      debouncedSlug !== formData.slug
    ) {
      console.log("[CreateOrganizationModal] Slug availability unknown - debounce not complete", {
        slug: formData.slug,
        debouncedSlug,
      });
      toast.error("يرجى الانتظار حتى يتم التحقق من المعرف");
      return;
    }

    // Final check: slug must be confirmed available
    if (!isSlugAvailable && formData.slug.trim().length > 0) {
      console.log("[CreateOrganizationModal] Slug not confirmed available", {
        isSlugAvailable,
        isSlugTaken,
        isCheckingSlug,
        slugCheck,
      });
      toast.error("يرجى التأكد من أن المعرف متاح");
      return;
    }

    console.log("[CreateOrganizationModal] Starting submission");
    setIsSubmitting(true);
    try {
      const orgId = await createOrganization({
        userId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
      });
      console.log("[CreateOrganizationModal] Organization created successfully", orgId);
      toast.success("تم إنشاء المنظمة بنجاح");
      setFormData({ name: "", slug: "" });
      setSlugError("");
      setDebouncedSlug("");
      if (!blocking) {
        onOpenChange(false);
      } else {
        // Reload page to refresh organization context
        window.location.reload();
      }
    } catch (error: any) {
      console.error("[CreateOrganizationModal] Error creating organization", error);
      // Handle specific error messages from backend
      const errorMessage = error?.message || "فشل إنشاء المنظمة";
      if (errorMessage.includes("المعرف مستخدم")) {
        setSlugError("هذا المعرف مستخدم بالفعل");
      } else if (errorMessage.includes("منظمة واحدة فقط")) {
        toast.error("يمكن للمستخدم إنشاء منظمة واحدة فقط");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for button click (fallback if form submission doesn't work)
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("[CreateOrganizationModal] Button clicked directly");
    handleSubmit();
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={blocking ? undefined : onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        showCloseButton={!blocking}
        onPointerDownOutside={(e) => blocking && e.preventDefault()}
        onEscapeKeyDown={(e) => blocking && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            إنشاء منظمة جديدة
          </DialogTitle>
          <DialogDescription>
            {blocking
              ? "يجب إنشاء منظمة للوصول إلى لوحة التحكم. يمكن للمستخدم إنشاء منظمة واحدة فقط."
              : "أنشئ منظمة جديدة لإدارة حملاتك واتصالاتك. يمكن للمستخدم إنشاء منظمة واحدة فقط."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">
              اسم المنظمة <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="أدخل اسم المنظمة"
              required
              disabled={isSubmitting || isUserLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-slug">
              المعرف (Slug) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="org-slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="my-organization"
                required
                disabled={isSubmitting || isUserLoading}
                className={
                  slugError || isSlugTaken
                    ? "border-destructive pr-10"
                    : "pr-10"
                }
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {isCheckingSlug && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {isSlugAvailable && (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                {isSlugTaken && (
                  <XCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            {slugError && (
              <p className="text-sm text-destructive">{slugError}</p>
            )}
            {!slugError && isSlugAvailable && (
              <p className="text-sm text-green-600">هذا المعرف متاح</p>
            )}
            <p className="text-xs text-muted-foreground">
              أحرف إنجليزية وأرقام فقط (مثال: my-organization)
            </p>
          </div>

          <DialogFooter>
            {!blocking && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            )}
            <Button
              type="submit"
              onClick={handleButtonClick}
              disabled={
                isSubmitting ||
                isUserLoading ||
                !formData.name.trim() ||
                !formData.slug.trim() ||
                !!slugError ||
                isSlugTaken ||
                isCheckingSlug ||
                // Disable if slug exists but we haven't confirmed it's available yet
                // (debounce hasn't completed or query hasn't returned)
                (formData.slug.trim().length > 0 &&
                  debouncedSlug !== formData.slug &&
                  validateSlugFormat(formData.slug))
              }
            >
              {isUserLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري تحميل بيانات المستخدم...
                </>
              ) : isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                "إنشاء المنظمة"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
