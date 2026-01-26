"use client"

import { WorkflowBuilder } from "@/components/WorkflowBuilder"
import { useParams } from "next/navigation"

export default function EditWorkflowPage() {
    const params = useParams()
    const id = params.id as string

    return <WorkflowBuilder workflowId={id} />
}
