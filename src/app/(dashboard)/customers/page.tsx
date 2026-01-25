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
     ;(chats || []).forEach((c: any) => {
      if (c.contactPhone) map.set(c.contactPhone, String(c._id))
     })
     return map
   }, [chats])
 
   const uniqueTags = useMemo(() => {
     const set = new Set<string>()
     ;(contacts || []).forEach((c: any) => (c.tags || []).forEach((t: any) => set.add(t)))
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
     <div className="space-y-6 m-16">
       <div className="flex items-start justify-between">
         <div>
           <div className="flex items-center gap-2">
             <Users className="h-6 w-6 text-primary" />
             <h1 className="text-2xl font-semibold">العملاء</h1>
           </div>
           <p className="text-muted-foreground text-sm mt-1">
             إدارة جهات الاتصال والوسوم وبدء المحادثات
           </p>
         </div>
 
        <CustomersHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
       </div>
 
       <Card>
         <CardHeader className="space-y-2">
           <CardTitle>قائمة العملاء</CardTitle>
           <CardDescription>
             إجمالي: {contacts ? contacts.length : 0}
           </CardDescription>
          <TagFilter tags={uniqueTags} selected={selectedTag} onSelect={setSelectedTag} />
         </CardHeader>
         <CardContent>
          {!contacts ? (
            <div className="py-10 text-center text-muted-foreground">جاري التحميل...</div>
          ) : (
            <CustomersList contacts={filteredContacts} chatByPhone={chatByPhone} />
          )}
         </CardContent>
       </Card>
     </div>
   )
 }
