"use client"

import { useMemo, useState } from "react"
import { useUserContext } from "@/hooks/useUserContext"
import { useUserQuery } from "@/hooks/useUserQuery"
import { usePaginatedQuery, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import { CustomersHeader } from "./_components/CustomersHeader"
import { TagFilter } from "./_components/TagFilter"
import { CustomersList } from "./_components/CustomersList"

export default function CustomersPage() {
  const { userId } = useUserContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // 1. Paginated Query (Default View)
  const {
    results: paginatedContacts,
    status,
    loadMore
  } = usePaginatedQuery(
    api.contacts.listPaginated,
    userId ? { userId } : "skip",
    { initialNumItems: 20 }
  )

  // 2. Full Query (Search/Filter Mode)
  // Only fetch if filtering is active to save resources
  const isFiltering = searchQuery.trim().length > 0 || selectedTag !== null
  const allContacts = useUserQuery(
    api.contacts.list,
    isFiltering ? { limit: 1000 } : "skip"
  )
  const isFilteringTruncated = isFiltering && allContacts?.length === 1000

  const chats = useUserQuery(api.chat.listChats, {})

  const chatByPhone = useMemo(() => {
    const map = new Map<string, string>()
      ; (chats || []).forEach((c: any) => {
        if (c.contactPhone) map.set(c.contactPhone, String(c._id))
      })
    return map
  }, [chats])

  // Determine which list to show
  const displayContacts = useMemo(() => {
    if (isFiltering) {
      if (!allContacts) return []
      let list = allContacts

      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase()
        list = list.filter((c: any) =>
          (c.name || "").toLowerCase().includes(lowerQ) ||
          (c.phone || "").includes(searchQuery)
        )
      }

      if (selectedTag) {
        list = list.filter((c: any) => (c.tags || []).includes(selectedTag))
      }
      return list
    }
    return paginatedContacts || []
  }, [isFiltering, allContacts, paginatedContacts, searchQuery, selectedTag])

  // Get unique tags from the small set (paginated) or full set if filtering?
  // Ideally tags should come from a separate query or aggregation. 
  // For now, let's just use the current display set to avoid confusing filters.
  const uniqueTags = useMemo(() => {
    const set = new Set<string>()
    if (isFiltering && allContacts) {
      allContacts.forEach((c: any) => {
        (c.tags || []).forEach((t: any) => {
          set.add(t)
        })
      })
    } else {
      // Fallback: If not filtering, we only show tags from visible 20 items? 
      // This is a UI limitation of client-side tags. Let's stick to visible for now or fetch stats.
      (paginatedContacts || []).forEach((c: any) => {
        (c.tags || []).forEach((t: any) => {
          set.add(t)
        })
      })
    }
    return Array.from(set).sort()
  }, [isFiltering, allContacts, paginatedContacts])

  const isLoading = (isFiltering && !allContacts) || (!isFiltering && !paginatedContacts)

  return (
    <div className="space-y-10 p-6 sm:p-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">العملاء</h1>
          </div>
          <p className="text-base text-muted-foreground font-medium">إدارة جهات الاتصال الخاصة بك وتتبع تفاعلات العملاء.</p>
        </div>

        <CustomersHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allContacts={isFiltering ? allContacts || [] : paginatedContacts || []}
          uniqueTags={uniqueTags}
          filteredContacts={displayContacts}
        />
      </div>

      {/* Main Content */}
      <Card className="border border-border/50 bg-card rounded-[24px] shadow-none overflow-hidden">
        <CardHeader className="p-8 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black">قائمة العملاء</CardTitle>
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">
                {isFiltering
                  ? `النتائج: ${displayContacts.length}${isFilteringTruncated ? " (محدود بـ 1000)" : ""}`
                  : `إجمالي العملاء: ${displayContacts.length}${status === "CanLoadMore" ? "+" : ""}`
                }
              </CardDescription>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30">
            <TagFilter tags={uniqueTags} selected={selectedTag} onSelect={setSelectedTag} />
          </div>
          {isFilteringTruncated && (
            <div className="mt-2 text-warning text-xs font-medium bg-warning/10 p-2 rounded-md">
              تنبيه: يتم عرض أول 1000 عميل فقط. يرجى تضييق نطاق البحث للحصول على نتائج أدق.
            </div>
          )}
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="font-bold text-muted-foreground">جارٍ التحميل...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <CustomersList contacts={displayContacts} chatByPhone={chatByPhone} />
              </div>

              {!isFiltering && status === "CanLoadMore" && (
                <div className="flex justify-center pt-4">
                  <Button
                    onClick={() => loadMore(20)}
                    variant="outline"
                    className="gap-2 min-w-[150px]"
                  >
                    عرض المزيد
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
