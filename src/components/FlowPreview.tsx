"use client"

import {
    MessageSquare,
    Users,
    Tag,
    Send,
    Trash,
    UserPlus,
    Bell,
    Clock,
    ArrowLeft,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const ICONS: Record<string, any> = {
    new_message: MessageSquare,
    contact_created: Users,
    keyword: Tag,
    tag_added: Tag,
    send_template: Send,
    add_tag: Tag,
    remove_tag: Trash,
    assign_user: UserPlus,
    notify: Bell,
    delay: Clock,
}

const COLORS: Record<string, string> = {
    new_message: "text-warning bg-warning/10",
    contact_created: "text-info bg-info/10",
    keyword: "text-warning bg-warning/10",
    tag_added: "text-warning bg-warning/10",
    send_template: "text-success bg-success/10",
    add_tag: "text-success bg-success/10",
    remove_tag: "text-destructive bg-destructive/10",
    assign_user: "text-primary bg-primary/10",
    notify: "text-primary bg-primary/10",
    delay: "text-slate-500 bg-slate-100",
}

interface FlowPreviewProps {
    trigger: string
    steps: any[]
    className?: string
}

export function FlowPreview({ trigger, steps, className }: FlowPreviewProps) {
    const TriggerIcon = ICONS[trigger] || MessageSquare

    return (
        <div className={cn("flex items-center gap-2 overflow-x-auto py-2", className)} dir="rtl">
            {/* Trigger */}
            <div className={cn("p-2 rounded-[16px] shrink-0 border border-current transition-all", COLORS[trigger] || "text-slate-400 bg-slate-50")}>
                <TriggerIcon className="h-4 w-4" />
            </div>

            {/* Connector */}
            {steps.length > 0 && <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0" />}

            {/* Steps */}
            <div className="flex items-center gap-2">
                {steps.map((step, index) => {
                    const StepIcon = ICONS[step.type] || Zap

                    return (
                        <div key={index} className="flex items-center gap-2">
                            <div title={step.type} className={cn("p-2 rounded-[16px] shrink-0 border border-current", COLORS[step.type] || "text-slate-400 bg-slate-50")}>
                                <StepIcon className="h-4 w-4" />
                            </div>
                            {index < steps.length - 1 && <ArrowLeft className="h-4 w-4 text-slate-300 shrink-0" />}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
