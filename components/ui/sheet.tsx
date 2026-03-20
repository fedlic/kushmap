"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px]" onClick={() => onOpenChange(false)} />
      {children}
    </div>
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  const sideClasses = {
    bottom: "inset-x-0 bottom-0 border-t",
    top: "inset-x-0 top-0 border-b",
    left: "inset-y-0 left-0 w-3/4 sm:max-w-sm border-r",
    right: "inset-y-0 right-0 w-3/4 sm:max-w-sm border-l",
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-background shadow-lg",
        sideClasses[side],
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <button
          onClick={() => {
            const event = new Event("close-sheet", { bubbles: true })
            document.dispatchEvent(event)
          }}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export { Sheet, SheetContent }
