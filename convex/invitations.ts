import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Invite a user to an organization
export const invite = mutation({
    args: {
        organizationId: v.id("organizations"),
        invitedBy: v.id("users"),
        email: v.string(),
        role: v.union(v.literal("admin"), v.literal("agent"), v.literal("viewer")),
    },
    handler: async (ctx, args) => {
        // 1. Verify inviter permissions
        const membership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_org_user", (q) =>
                q.eq("organizationId", args.organizationId).eq("userId", args.invitedBy)
            )
            .first();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("ليس لديك صلاحية لدعوة أعضاء");
        }

        // 2. Check if user is already a member
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();

        if (existingUser) {
            const isMember = await ctx.db
                .query("organizationMembers")
                .withIndex("by_org_user", (q) =>
                    q.eq("organizationId", args.organizationId).eq("userId", existingUser._id)
                )
                .first();

            if (isMember) {
                throw new Error("المستخدم عضو بالفعل في هذه المنظمة");
            }
        }

        // 3. Check for existing pending invitation
        const existingInvite = await ctx.db
            .query("invitations")
            .withIndex("by_email_org", (q) =>
                q.eq("email", args.email).eq("organizationId", args.organizationId)
            )
            .filter((q) => q.eq(q.field("status"), "pending"))
            .first();

        if (existingInvite) {
            throw new Error("توجد دعوة معلقة بالفعل لهذا البريد الإلكتروني");
        }

        const now = Date.now();
        const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

        // 4. Create invitation
        const inviteId = await ctx.db.insert("invitations", {
            email: args.email,
            organizationId: args.organizationId,
            role: args.role,
            status: "pending",
            invitedBy: args.invitedBy,
            createdAt: now,
            expiresAt: expiresAt,
        });

        return inviteId;
    },
});

// List pending invitations for an organization
export const listPending = query({
    args: { organizationId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("invitations")
            .withIndex("by_org", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("status"), "pending"))
            .collect();
    },
});

// Accept an invitation
export const acceptInvite = mutation({
    args: {
        inviteId: v.id("invitations"),
        userId: v.id("users")
    },
    handler: async (ctx, args) => {
        const invite = await ctx.db.get(args.inviteId);
        if (!invite || invite.status !== "pending") {
            throw new Error("الدعوة غير صالحة أو منتهية");
        }

        const user = await ctx.db.get(args.userId);
        if (!user || user.email !== invite.email) {
            throw new Error("هذه الدعوة ليست مخصصة لك");
        }

        if (invite.expiresAt < Date.now()) {
            await ctx.db.patch(args.inviteId, { status: "expired" });
            throw new Error("انتهت صلاحية هذه الدعوة");
        }

        // 1. Add user to organization
        await ctx.db.insert("organizationMembers", {
            organizationId: invite.organizationId,
            userId: args.userId,
            role: invite.role,
            joinedAt: Date.now(),
        });

        // 2. Set as current organization if not already in one
        if (!user.currentOrganizationId) {
            await ctx.db.patch(args.userId, {
                currentOrganizationId: invite.organizationId,
            });
        }

        // 3. Mark invite as accepted
        await ctx.db.patch(args.inviteId, { status: "accepted" });

        return invite.organizationId;
    },
});

// Cancel or delete an invitation
export const cancelInvite = mutation({
    args: {
        inviteId: v.id("invitations"),
        userId: v.id("users") // User performing the action
    },
    handler: async (ctx, args) => {
        const invite = await ctx.db.get(args.inviteId);
        if (!invite) throw new Error("Invite not found");

        // Check permissions
        const membership = await ctx.db
            .query("organizationMembers")
            .withIndex("by_org_user", (q) =>
                q.eq("organizationId", invite.organizationId).eq("userId", args.userId)
            )
            .first();

        if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
            throw new Error("ليس لديك صلاحية لإلغاء الدعوات");
        }

        await ctx.db.patch(args.inviteId, { status: "cancelled" });
    },
});
