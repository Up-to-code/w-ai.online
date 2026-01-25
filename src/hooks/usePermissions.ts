"use client"

import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useUserContext } from "./useUserContext"
import { useOrganizationContext } from "./useOrganizationContext"
import { PERMISSIONS } from "../../convex/permissions"

export function usePermissions() {
  const { userId } = useUserContext()
  const { currentOrganization, userRole } = useOrganizationContext()
  const organizationId = currentOrganization?._id

  // Check if user has a specific permission
  const hasPermission = useQuery(
    api.permissions.checkPermission,
    userId && organizationId
      ? {
          userId,
          organizationId,
          permission: PERMISSIONS.MANAGE_ORG, // This will be dynamic
        }
      : "skip"
  )

  // Helper functions for common permission checks
  const canManageOrganization = userRole === "owner"
  const canManageMembers = userRole === "owner"
  const canManageIntegrations = userRole === "owner" || userRole === "admin"
  const canManageCampaigns = userRole === "owner" || userRole === "admin" || userRole === "agent"
  const canSendMessages = userRole === "owner" || userRole === "admin" || userRole === "agent"
  const canViewReports = true // All roles can view reports
  const canManageContacts = userRole === "owner" || userRole === "admin" || userRole === "agent"
  const canManageTemplates = userRole === "owner" || userRole === "admin"
  const canManageWorkflows = userRole === "owner" || userRole === "admin"

  // Check permission by string
  const checkPermission = (permission: string): boolean => {
    switch (permission) {
      case PERMISSIONS.MANAGE_ORG:
        return canManageOrganization
      case PERMISSIONS.MANAGE_MEMBERS:
        return canManageMembers
      case PERMISSIONS.MANAGE_INTEGRATIONS:
        return canManageIntegrations
      case PERMISSIONS.MANAGE_CAMPAIGNS:
        return canManageCampaigns
      case PERMISSIONS.SEND_MESSAGES:
        return canSendMessages
      case PERMISSIONS.VIEW_REPORTS:
        return canViewReports
      case PERMISSIONS.MANAGE_CONTACTS:
        return canManageContacts
      case PERMISSIONS.MANAGE_TEMPLATES:
        return canManageTemplates
      case PERMISSIONS.MANAGE_WORKFLOWS:
        return canManageWorkflows
      default:
        return false
    }
  }

  return {
    canManageOrganization,
    canManageMembers,
    canManageIntegrations,
    canManageCampaigns,
    canSendMessages,
    canViewReports,
    canManageContacts,
    canManageTemplates,
    canManageWorkflows,
    checkPermission,
    userRole,
    isOwner: userRole === "owner",
    isAdmin: userRole === "admin" || userRole === "owner",
    isAgent: userRole === "agent",
    isViewer: userRole === "viewer",
  }
}
