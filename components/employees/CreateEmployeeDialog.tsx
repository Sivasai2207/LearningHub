'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEmployee } from '@/app/t/[tenantSlug]/admin/employees/actions'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface CreateEmployeeDialogProps {
    tenantId: string
    tenantSlug: string
}

export function CreateEmployeeDialog({ 
    tenantId, 
    tenantSlug 
}: CreateEmployeeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    const formData = new FormData(event.currentTarget)
    
    // Zod validation handles logic on server, but we could add client side here too.

    const result = await createEmployee(formData, tenantId, tenantSlug)

    setLoading(false)

    if (result?.error) {
        toast.error(result.error)
    } else {
        toast.success('Employee created successfully')
        setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a new user account. They will be able to log in immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="employee">
                        <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Temporary Password</Label>
                    <Input id="password" name="password" type="text" minLength={6} required placeholder="min 6 chars" />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create User'}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
