// @ts-nocheck - Type instantiation depth errors are TypeScript compiler limitations
import { mutation, query, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { components } from "./_generated/api";
import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import type { DataModel } from "./_generated/dataModel";
import { logger } from "./logger";

const pushNotifications = new PushNotifications(components.pushNotifications);

// WorkOS AuthKit Integration
const authFunctions: AuthFunctions = internal.auth;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
  additionalEventTypes: ["session.created", "session.revoked"],
});

// Export the action handler for OAuth callbacks
// This is required by authKit.registerRoutes() to handle OAuth code exchange
export const authKitAction = authKit.action;

// Sync WorkOS users to our users table
export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    await ctx.db.insert("users", {
      authId: event.data.id, // WorkOS user ID
      email: event.data.email,
      name: `${event.data.firstName || ''} ${event.data.lastName || ''}`.trim(),
      role: "user",
      phone: (event.data as any).phoneNumber || (event.data as any).phone || undefined,
    });
  },
  "user.updated": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", event.data.id))
      .first();
    if (user) {
      await ctx.db.patch(user._id, {
        email: event.data.email,
        name: `${event.data.firstName || ''} ${event.data.lastName || ''}`.trim(),
        phone: (event.data as any).phoneNumber || (event.data as any).phone || undefined,
      });
    }
  },
  "user.deleted": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", event.data.id))
      .first();
    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx, _args) => {
    const authUser = await authKit.getAuthUser(ctx);
    if (!authUser) return null;
    
    // Get our app's user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", authUser.id))
      .first();
    
    return user;
  },
});

// Ensure user exists in database (create if missing)
// This fixes race conditions where WorkOS user exists but app user record doesn't
export const ensureUserExists = mutation({
  args: {},
  handler: async (ctx, _args) => {
    const authUser = await authKit.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }
    
    // Check if user already exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", authUser.id))
      .first();
    
    // Create user if doesn't exist
    if (!user) {
      const userId = await ctx.db.insert("users", {
        authId: authUser.id,
        email: authUser.email,
        name: `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim() || authUser.email || "User",
        role: "user",
        phone: (authUser as any).phoneNumber || (authUser as any).phone || undefined,
      });
      user = await ctx.db.get(userId);
    }
    
    return user;
  },
});

// Get user by WorkOS auth ID
export const getByAuthId = query({
  args: { authId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_auth_id", (q) => q.eq("authId", args.authId))
      .first();
  },
});

// Cellular Auth: Send OTP
export const sendOTP = mutation({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    // International numbers (E.164) typically range from 7 to 15 digits.
    if (args.phone.length < 7) {
      throw new Error("رقم الهاتف قصير جداً. يرجى إدخال الرقم كاملاً مع كود الدولة (مثال: 966...)");
    }

    // 1. Generate 6 digit code
    logger.debug(`[Auth] Generating OTP for raw input: "${args.phone}"`);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // 2. Store in DB
    const existing = await ctx.db
      .query("otps")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { code, expiresAt, attempts: 0 });
    } else {
      await ctx.db.insert("otps", { phone: args.phone, code, expiresAt, attempts: 0 });
    }

    // 3. Send via WhatsApp
    logger.info(`[Auth] Attempting to schedule WhatsApp OTP for ${args.phone}...`);
    try {
      await ctx.scheduler.runAfter(0, api.whatsapp.sendMessage, {
        to: args.phone,
        type: "text",
        content: { body: `رمز التحقق الخاص بك لـ W-AI هو: ${code}` },
      });
      logger.info(`[Auth] WhatsApp OTP scheduled successfully for ${args.phone}`);
    } catch (err) {
      logger.error(`[Auth] FAILED to schedule WhatsApp OTP: ${err}`);
    }

    return { success: true, message: "تم إرسال رمز التحقق عبر واتساب" };
  },
});

// Cellular Auth: Verify OTP
export const verifyOTP = mutation({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const otpRecord = await ctx.db
      .query("otps")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (!otpRecord) throw new Error("لم يتم العثور على طلب تحقق"); // No OTP request found
    if (otpRecord.code !== args.code) throw new Error("رمز التحقق غير صحيح"); // Invalid code
    if (Date.now() > otpRecord.expiresAt) throw new Error("انتهت صلاحية الرمز"); // Code expired

    // Clear OTP
    await ctx.db.delete(otpRecord._id);

    // Find or create user
    let user = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        phone: args.phone,
        role: "user",
        name: "مستخدم " + args.phone.slice(-4), // User + last 4 digits
      });
      user = await ctx.db.get(userId);
    }

    return user?._id;
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");
    if (user.password !== args.password) throw new Error("كلمة المرور غير صحيحة");

    return user._id;
  },
});

export const register = mutation({
  args: { email: v.string(), password: v.string(), name: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) throw new Error("البريد الإلكتروني مسجل مسبقاً");

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password,
      name: args.name || "مستخدم جديد",
      role: "user",
    });

    return userId;
  },
});

export const updateUser = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;

    await ctx.db.patch(args.userId, updates);
    return true;
  },
});

export const changePassword = mutation({
  args: { 
    userId: v.id("users"), 
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    if (user.password !== args.currentPassword) {
      throw new Error("كلمة المرور الحالية غير صحيحة");
    }

    if (args.newPassword.length < 6) {
      throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    }

    await ctx.db.patch(args.userId, { password: args.newPassword });
    return true;
  },
});

export const recordPushNotificationToken = mutation({
  args: { token: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    // Verify user exists
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("المستخدم غير موجود");

    // Record the push token
    await pushNotifications.recordToken(ctx, {
      userId: args.userId,
      pushToken: args.token,
    });

    return true;
  },
});
