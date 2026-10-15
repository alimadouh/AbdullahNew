import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

// Page mode: inside <DialogPageProvider> a Dialog renders inline as a normal page section
// (no overlay, no portal, no close X), so tools open as their own page and the phone
// keyboard never covers them. Nested real dialogs inside a page still work as popups.
const DialogPageContext = React.createContext(false)
const InlineContext = React.createContext(false)
const DialogPageProvider = ({ children }) => (
  <DialogPageContext.Provider value={true}>{children}</DialogPageContext.Provider>
)

// Tools clean up in their own unmount effects, so leaving the page needs no extra close call
function InlineDialog({ children }) {
  return (
    <DialogPageContext.Provider value={false}>
      <InlineContext.Provider value={true}>{children}</InlineContext.Provider>
    </DialogPageContext.Provider>
  )
}

const Dialog = ({ children, ...props }) => {
  const page = React.useContext(DialogPageContext)
  if (page) return <InlineDialog>{children}</InlineDialog>
  return (
    <DialogPrimitive.Root {...props}>
      <InlineContext.Provider value={false}>{children}</InlineContext.Provider>
    </DialogPrimitive.Root>
  )
}
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-[dialog-overlay-in_150ms_ease-out] data-[state=closed]:animate-[dialog-overlay-out_150ms_ease-in]",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

// The scroll lock only lets the dialog's own scroll area move, so the mouse wheel did nothing over
// the title or the dark backdrop. Send those wheel moves to the area marked data-dialog-scroll.
const forwardWheel = (box, e) => {
  const area = box?.querySelector("[data-dialog-scroll]")
  if (!area || area.contains(e.target)) return
  const step = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? area.clientHeight : 1
  area.scrollTop += e.deltaY * step
}

// Popup-only size limits that make no sense on a page
const stripPopupSizing = (cls) => String(cls || '').split(/\s+/).filter(c => !/^(max-h-|overflow-y-|overflow-)/.test(c)).join(' ')

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const inline = React.useContext(InlineContext)
  const boxRef = React.useRef(null)
  if (inline) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative mx-auto w-full max-w-lg rounded-2xl border bg-card p-4 shadow-sm sm:p-6",
          stripPopupSizing(className)
        )}
      >
        {children}
      </div>
    )
  }
  const onWheel = (e) => forwardWheel(boxRef.current, e)
  return (
  <DialogPortal>
    <DialogOverlay onWheel={onWheel} />
    {/* Flex-column wrapper sized to the visible viewport (so it stays above the iOS keyboard);
        centers when content fits, scrolls when it doesn't */}
    <div
      className="fixed inset-x-0 top-0 z-50 flex flex-col items-center overflow-y-auto p-4 sm:p-6"
      style={{ top: "var(--app-vt, 0px)", height: "var(--app-vh, 100dvh)" }}
      ref={boxRef}
      onWheel={onWheel}
    >
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "relative my-auto w-full max-w-lg border bg-background p-6 shadow-lg sm:rounded-xl data-[state=open]:animate-[dialog-fade-in_200ms_ease-out] data-[state=closed]:animate-[dialog-fade-out_150ms_ease-in]",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-3 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-muted/80 hover:bg-muted ring-offset-background transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer">
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </div>
  </DialogPortal>
  )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => React.useContext(InlineContext) ? (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
) : (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => React.useContext(InlineContext) ? (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
) : (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPageProvider,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
