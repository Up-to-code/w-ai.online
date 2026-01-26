import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const list = query({
    args: { userId: v.id("users") }, // User making the request
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            return [];
        }
        const workflows = await ctx.db
            .query("workflows")
            .withIndex("by_org", (q) => q.eq("organizationId", user.currentOrganizationId))
            .order("desc")
            .collect();

        // Simple migration/wrapping for legacy workflows
        return workflows.map(w => {
            if ((!w.steps || w.steps.length === 0) && w.action) {
                return {
                    ...w,
                    steps: [{ type: w.action, config: w.actionConfig || {} }]
                };
            }
            return w;
        });
    }
});

export const getById = query({
    args: {
        organizationId: v.id("organizations"),
        id: v.id("workflows")
    },
    handler: async (ctx, args) => {
        const workflow = await ctx.db.get(args.id);
        if (!workflow || workflow.organizationId !== args.organizationId) {
            return null;
        }

        // Migrate legacy on the fly for the builder
        if ((!workflow.steps || workflow.steps.length === 0) && workflow.action) {
            return {
                ...workflow,
                steps: [{ type: workflow.action, config: workflow.actionConfig || {} }]
            };
        }

        return workflow;
    }
});

export const create = mutation({
    args: {
        userId: v.id("users"),
        name: v.string(),
        description: v.optional(v.string()),
        trigger: v.string(),
        triggerConfig: v.any(),
        steps: v.array(v.object({ type: v.string(), config: v.any() })),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        return await ctx.db.insert("workflows", {
            userId: args.userId,
            organizationId: user.currentOrganizationId,
            name: args.name,
            description: args.description,
            trigger: args.trigger,
            triggerConfig: args.triggerConfig,
            steps: args.steps,
            enabled: true,
            stats: { runs: 0 },
            createdAt: Date.now(),
        });
    }
});

export const toggle = mutation({
    args: {
        userId: v.id("users"),
        id: v.id("workflows")
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const workflow = await ctx.db.get(args.id);
        if (!workflow || workflow.organizationId !== user.currentOrganizationId) {
            throw new Error("Workflow not found or access denied");
        }
        await ctx.db.patch(args.id, { enabled: !workflow.enabled });
    }
});

export const update = mutation({
    args: {
        userId: v.id("users"),
        id: v.id("workflows"),
        name: v.string(),
        description: v.optional(v.string()),
        trigger: v.string(),
        triggerConfig: v.any(),
        steps: v.array(v.object({ type: v.string(), config: v.any() })),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const workflow = await ctx.db.get(args.id);
        if (!workflow || workflow.organizationId !== user.currentOrganizationId) {
            throw new Error("Workflow not found or access denied");
        }
        await ctx.db.patch(args.id, {
            name: args.name,
            description: args.description,
            trigger: args.trigger,
            triggerConfig: args.triggerConfig,
            steps: args.steps,
        });
    }
});

export const remove = mutation({
    args: {
        userId: v.id("users"), // User making the request
        id: v.id("workflows")
    },
    handler: async (ctx, args) => {
        // Get user's current organization
        const user = await ctx.db.get(args.userId);
        if (!user || !user.currentOrganizationId) {
            throw new Error("يجب أن يكون لديك منظمة نشطة");
        }
        const workflow = await ctx.db.get(args.id);
        if (!workflow || workflow.organizationId !== user.currentOrganizationId) {
            throw new Error("Workflow not found or access denied");
        }
        await ctx.db.delete(args.id);
    }
});

// --- Advanced Execution Engine (Supports Sequential Steps & Delays) ---

export const continueWorkflowExecution = internalMutation({
    args: {
        workflowId: v.id("workflows"),
        stepIndex: v.number(),
        organizationId: v.id("organizations"),
        contactPhone: v.string(),
        contactId: v.optional(v.id("contacts")),
    },
    handler: async (ctx, args) => {
        const workflow = await ctx.db.get(args.workflowId);
        if (!workflow || !workflow.enabled) return;

        const steps = workflow.steps || [];
        if (args.stepIndex >= steps.length) return;

        // Process steps starting from stepIndex
        for (let i = args.stepIndex; i < steps.length; i++) {
            const step = steps[i];
            const { type, config } = step;

            if (type === "delay") {
                const duration = config?.duration || 60; // minutes
                const unit = config?.unit || "minutes";
                const delayMs = unit === "hours" ? duration * 60 * 60 * 1000 :
                    unit === "days" ? duration * 24 * 60 * 60 * 1000 :
                        duration * 60 * 1000;

                await ctx.scheduler.runAfter(delayMs, internal.workflows.continueWorkflowExecution, {
                    workflowId: args.workflowId,
                    stepIndex: i + 1,
                    organizationId: args.organizationId,
                    contactPhone: args.contactPhone,
                    contactId: args.contactId
                });
                return; // Stop current execution, it will resume via scheduler
            }

            // Standard Actions
            if (type === "send_template") {
                const templateName = config?.template;
                if (templateName) {
                    await ctx.scheduler.runAfter(0, api.whatsapp.sendMessage, {
                        organizationId: args.organizationId as any,
                        to: args.contactPhone,
                        type: "template",
                        content: {
                            name: templateName,
                            language: { code: "ar" },
                            components: []
                        }
                    });
                }
            } else if (type === "add_tag") {
                const tag = config?.tag;
                if (tag) {
                    const contact = args.contactId ? await ctx.db.get(args.contactId) :
                        await ctx.db.query("contacts").withIndex("by_org_phone", q => q.eq("organizationId", args.organizationId).eq("phone", args.contactPhone)).first();

                    if (contact && contact.organizationId === args.organizationId) {
                        const tags = contact.tags || [];
                        if (!tags.includes(tag)) await ctx.db.patch(contact._id, { tags: [...tags, tag] });
                    }
                }
            } else if (type === "remove_tag") {
                const tag = config?.tag;
                if (tag) {
                    const contact = args.contactId ? await ctx.db.get(args.contactId) :
                        await ctx.db.query("contacts").withIndex("by_org_phone", q => q.eq("organizationId", args.organizationId).eq("phone", args.contactPhone)).first();

                    if (contact && contact.organizationId === args.organizationId && contact.tags?.includes(tag)) {
                        const newTags = contact.tags.filter((t: string) => t !== tag);
                        await ctx.db.patch(contact._id, { tags: newTags });
                    }
                }
            } else if (type === "assign_user") {
                const assignUserId = config?.userId;
                if (assignUserId) {
                    const chat = await ctx.db.query("chats").withIndex("by_org_contact", q => q.eq("organizationId", args.organizationId).eq("contactPhone", args.contactPhone)).first();
                    if (chat) await ctx.db.patch(chat._id, { assignedTo: assignUserId as any });
                }
            } else if (type === "notify") {
                const message = config?.message || `Automation Rule "${workflow.name}" triggered.`;
                await ctx.scheduler.runAfter(0, internal.notifications.create, {
                    organizationId: args.organizationId as any,
                    type: "info",
                    title: "Automation Alert",
                    message: message,
                    link: `/workflows/${workflow._id}`
                });
            }
        }
    }
});

async function executeWorkflowAction(ctx: any, workflow: any, organizationId: string, contactPhone: string, contactId?: string) {
    console.log(`[Workflows] Starting execution for "${workflow.name}" for ${contactPhone}`);

    // Increment stats
    await ctx.db.patch(workflow._id, {
        stats: {
            runs: (workflow.stats?.runs || 0) + 1,
            lastRun: Date.now()
        }
    });

    // Start recursive step executor from step 0
    await ctx.runMutation(internal.workflows.continueWorkflowExecution, {
        workflowId: workflow._id,
        stepIndex: 0,
        organizationId: organizationId as any,
        contactPhone,
        contactId: contactId as any
    });
}

export const checkAndExecuteWorkflows = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        messageId: v.id("messages"),
        content: v.string(),
        contactPhone: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Fetch Active Workflows (filter by organizationId)
        const workflows = await ctx.db
            .query("workflows")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q: any) => q.eq(q.field("enabled"), true))
            .collect();

        if (workflows.length === 0) return;

        console.log(`[Workflows] Checking ${workflows.length} rules for message: ${args.messageId}`);

        for (const workflow of workflows) {
            let matched = false;

            // 2. Check Triggers
            if (workflow.trigger === "new_message") {
                matched = true;
            } else if (workflow.trigger === "keyword") {
                const keyword = workflow.triggerConfig?.keyword?.toLowerCase();
                if (keyword && args.content.toLowerCase().includes(keyword)) {
                    matched = true;
                }
            }

            // 3. Execute Action if Matched
            if (matched) {
                await executeWorkflowAction(ctx, workflow, args.organizationId, args.contactPhone);
            }
        }
    }
});

export const checkContactWorkflows = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        contactId: v.id("contacts"),
        contactPhone: v.string(),
        isNew: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Verify contact belongs to organization
        const contact = await ctx.db.get(args.contactId);
        if (!contact || contact.organizationId !== args.organizationId) {
            console.warn(`[Workflows] Contact ${args.contactId} does not belong to organization ${args.organizationId}`);
            return;
        }

        const workflows = await ctx.db
            .query("workflows")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q: any) => q.eq(q.field("enabled"), true))
            .collect();

        for (const workflow of workflows) {
            if (workflow.trigger === "contact_created" && args.isNew) {
                await executeWorkflowAction(ctx, workflow, args.organizationId, args.contactPhone, args.contactId);
            }
        }
    }
});
export const checkTagWorkflows = internalMutation({
    args: {
        organizationId: v.id("organizations"), // Organization-scoped
        contactId: v.id("contacts"),
        contactPhone: v.string(),
        addedTag: v.string(),
    },
    handler: async (ctx, args) => {
        // Verify contact belongs to organization
        const contact = await ctx.db.get(args.contactId);
        if (!contact || contact.organizationId !== args.organizationId) {
            console.warn(`[Workflows] Contact ${args.contactId} does not belong to organization ${args.organizationId}`);
            return;
        }
        const workflows = await ctx.db
            .query("workflows")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q: any) => q.eq(q.field("enabled"), true))
            .collect();

        for (const workflow of workflows) {
            if (workflow.trigger === "tag_added") {
                // Check if this is the specific tag we are looking for (optional, if UI supports specific tag trigger)
                // Assuming triggerConfig.tag might exist, or it triggers on ANY tag if empty
                const targetTag = workflow.triggerConfig?.tag;

                if (!targetTag || targetTag === args.addedTag) {
                    await executeWorkflowAction(ctx, workflow, args.organizationId, args.contactPhone, args.contactId);
                }
            }
        }
    }
});
