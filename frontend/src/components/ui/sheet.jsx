"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const SheetContext = React.createContext({ open: false, onOpenChange: () => {} });

function Sheet({ open, onOpenChange, children }) {
  return <SheetContext.Provider value={{ open, onOpenChange }}>{children}</SheetContext.Provider>;
}

function SheetTrigger({ children }) {
  return children;
}

function SheetClose({ children }) {
  const { onOpenChange } = React.useContext(SheetContext);
  return (
    <button type="button" onClick={() => onOpenChange(false)}>
      {children}
    </button>
  );
}

function SheetContent({ className, children, side = "right", showClose = true }) {
  const { open, onOpenChange } = React.useContext(SheetContext);
  if (!open) return null;

  const sideClass =
    side === "left"
      ? "left-0 inset-y-0 h-full w-3/4 border-r sm:max-w-sm"
      : side === "right"
        ? "right-0 inset-y-0 h-full w-3/4 border-l sm:max-w-sm"
        : side === "top"
          ? "inset-x-0 top-0 h-auto border-b"
          : "inset-x-0 bottom-0 h-auto border-t";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur" onClick={() => onOpenChange(false)} />
      <div className={cn("fixed z-50 flex flex-col gap-4 bg-white shadow-lg", sideClass, className)}>
        {children}
        {showClose && (
          <button type="button" className="absolute right-5 top-5 rounded-full hover:opacity-100" onClick={() => onOpenChange(false)}>
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </button>
        )}
      </div>
    </>
  );
}

function SheetHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1 border-b bg-slate-100 p-4", className)} {...props} />;
}

function SheetFooter({ className, ...props }) {
  return <div className={cn("mt-auto flex flex-col gap-2 border-t bg-slate-100 p-4", className)} {...props} />;
}

function SheetTitle({ className, ...props }) {
  return <div className={cn("font-semibold", className)} {...props} />;
}

function SheetDescription({ className, ...props }) {
  return <p className={cn("text-sm text-slate-600", className)} {...props} />;
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription
};

