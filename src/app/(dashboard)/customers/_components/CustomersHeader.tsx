"use client"

import { useState } from "react"
import { api } from "@convex/_generated/api"
import { useUserMutation } from "@/hooks/useUserMutation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, Plus, ArrowRight, FileSpreadsheet } from "lucide-react"
import { ExcelImportDialog } from "./ExcelImportDialog"
import { ExportDialog } from "./ExportDialog"

interface Props {
  searchQuery: string
  onSearchChange: (v: string) => void
  allContacts?: any[]
  uniqueTags?: string[]
  filteredContacts?: any[]
}

export function CustomersHeader({
  searchQuery,
  onSearchChange,
  allContacts = [],
  uniqueTags = [],
  filteredContacts = []
}: Props) {
  const createContact = useUserMutation(api.contacts.create)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newTags, setNewTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!newName || !newPhone) return
    setIsSubmitting(true)
    try {
      const tags = newTags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean)
      await createContact({
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
        tags,
      })
      setIsAddOpen(false)
      setNewName("")
      setNewPhone("")
      setNewEmail("")
      setNewTags("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative group">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="بحث بالاسم أو رقم الهاتف..."
          className="pr-10 w-[280px] h-12 rounded-[14px] border-border/50 bg-muted/20 font-bold focus:ring-primary/20 transition-all shadow-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <ExportDialog
          allContacts={allContacts}
          filteredContacts={filteredContacts}
          uniqueTags={uniqueTags}
        />

        <ExcelImportDialog />

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/95 text-white rounded-[14px] h-12 px-6 font-black shadow-none border-none">
              <Plus className="h-5 w-5" />
              إضافة عميل
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-[24px] p-0 overflow-hidden border-2 border-border/50 shadow-none">
            <DialogHeader className="p-6 bg-muted/20 border-b border-border/50">
              <DialogTitle className="text-xl font-black tracking-tight">إضافة عميل جديد</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="الاسم" className="h-11 rounded-[12px] border-2 border-border/50 font-bold" />
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="رقم الهاتف" className="h-11 rounded-[12px] border-2 border-border/50 font-bold" />
              </div>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="البريد الإلكتروني (اختياري)" className="h-11 rounded-[12px] border-2 border-border/50 font-bold" />
              <Input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="وسوم مفصولة بفواصل مثل: VIP, جديد" className="h-11 rounded-[12px] border-2 border-border/50 font-bold" />
              <div className="flex justify-end pt-2">
                <Button onClick={handleCreate} disabled={isSubmitting || !newName || !newPhone} className="gap-2 rounded-[14px] h-12 px-8 font-black bg-primary text-white shadow-none">
                  حفظ العميل
                  <ArrowRight className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
