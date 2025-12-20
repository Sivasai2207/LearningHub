'use client'

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Profile } from "@/types/db"

interface EmployeeSelectorProps {
    employees: Profile[]
    selectedId?: string
    onSelect: (id: string) => void
}

export function EmployeeSelector({ employees, selectedId, onSelect }: EmployeeSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(selectedId || "")

  // Sync prop changes
  React.useEffect(() => {
      if (selectedId) setValue(selectedId)
  }, [selectedId])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[300px] justify-between"
        >
          {value
            ? employees.find((emp) => emp.id === value)?.full_name
            : "Select employee..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search employee..." />
           <CommandList>
            <CommandEmpty>No employee found.</CommandEmpty>
            <CommandGroup>
                {employees.map((emp) => (
                <CommandItem
                    key={emp.id}
                    value={emp.full_name} // Command uses this for search filtering
                    onSelect={(currentValue) => {
                        // currentValue is the 'value' prop (full_name) lowercased by cmdk
                        // We need to map back to ID. 
                        // Better to use full_name as label and handle ID selection
                        onSelect(emp.id)
                        setValue(emp.id)
                        setOpen(false)
                    }}
                >
                    <Check
                    className={cn(
                        "mr-2 h-4 w-4",
                        value === emp.id ? "opacity-100" : "opacity-0"
                    )}
                    />
                    {emp.full_name}
                    <span className="ml-2 text-xs text-muted-foreground truncate">{emp.email}</span>
                </CommandItem>
                ))}
          </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
