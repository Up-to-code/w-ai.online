"use client"

import { useMemo, useState } from "react"
import { useUserQuery } from "@/hooks/useUserQuery"
import { api } from "@convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users } from "lucide-react"
import { CustomersHeader } from "./_components/CustomersHeader"
import { TagFilter } from "./_components/TagFilter"
import { CustomersList } from "./_components/CustomersList"

export default function CustomersPage() {
  const contacts = useUserQuery(api.contacts.list, { limit: 1000 })
  const chats = useUserQuery(api.chat.listChats, {})

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const chatByPhone = useMemo(() => {
    const map = new Map<string, string>()
      ; (chats || []).forEach((c: any) => {
        if (c.contactPhone) map.set(c.contactPhone, String(c._id))
      })
    return map
  }, [chats])

  const uniqueTags = useMemo(() => {
    const set = new Set<string>()
      ; (contacts || []).forEach((c: any) => (c.tags || []).forEach((t: any) => set.add(t)))
    return Array.from(set).sort()
  }, [contacts])

  const filteredContacts = useMemo(() => {
    const list = contacts || []
    const bySearch = searchQuery.trim()
      ? list.filter((c: any) =>
        (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || "").includes(searchQuery)
      )
      : list
    const byTag = selectedTag ? bySearch.filter((c: any) => (c.tags || []).includes(selectedTag)) : bySearch
    return byTag
  }, [contacts, searchQuery, selectedTag])

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
          allContacts={contacts || []}
          uniqueTags={uniqueTags}
          filteredContacts={filteredContacts}
        />
      </div>

      {/* Main Content */}
      <Card className="border border-border/50 bg-card rounded-[24px] shadow-none overflow-hidden">
        <CardHeader className="p-8 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black">قائمة العملاء</CardTitle>
              <CardDescription className="font-bold uppercase tracking-widest text-[10px]">
                إجمالي العملاء: {contacts ? contacts.length : 0}
              </CardDescription>
            </div>
          </div>
          <div className="pt-2 border-t border-border/30">
            <TagFilter tags={uniqueTags} selected={selectedTag} onSelect={setSelectedTag} />
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          {!contacts ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="font-bold text-muted-foreground">جارٍ التحميل...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <CustomersList contacts={filteredContacts} chatByPhone={chatByPhone} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
