"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";
import { useUserContext } from "@/hooks/useUserContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, Plus, Check, ChevronDown } from "lucide-react";
import { initialsFromName } from "@/lib/utils";
import { CreateOrganizationModal } from "./CreateOrganizationModal";

export function OrganizationSelector() {
  const { organizations, currentOrganization, switchToOrganization, isLoading } =
    useOrganizationContext();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Only show create button if user has 0 organizations
  const canCreateOrganization = organizations.length === 0;

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Building2 className="h-4 w-4 mr-2" />
        جاري التحميل...
      </Button>
    );
  }

  const orgName = currentOrganization?.name || "لا توجد منظمة";
  const orgInitials = initialsFromName(orgName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {orgInitials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[120px] truncate">{orgName}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>المنظمات</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org: any) => (
          <DropdownMenuItem
            key={org._id}
            onClick={() => switchToOrganization(org._id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {initialsFromName(org.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{org.name}</span>
            </div>
            {currentOrganization?._id === org._id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        {canCreateOrganization && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              إنشاء منظمة جديدة
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      <CreateOrganizationModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </DropdownMenu>
  );
}
