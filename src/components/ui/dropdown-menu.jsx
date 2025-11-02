/**
 * Simple Dropdown Menu Component
 * A lightweight implementation for the user profile dropdown
 */

import React, { useState, useEffect, useRef } from "react";

const DropdownContext = React.createContext();

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const menuRef = useRef(null);
  
  // Use controlled open if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block" ref={menuRef}>
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, { open, setOpen });
          }
          return child;
        })}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({ asChild, children, open, setOpen, ...props }) {
  const handleClick = () => {
    setOpen(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      onClick: handleClick
    });
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = "end", open, setOpen, ...props }) {
  const contentRef = useRef(null);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md ${
        align === "end" ? "right-0" : "left-0"
      } mt-2`}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ children, onClick, ...props }) {
  return (
    <div
      className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
      onClick={(e) => {
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, ...props }) {
  return (
    <div className="px-2 py-1.5 text-sm font-semibold" {...props}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ ...props }) {
  return <div className="-mx-1 my-1 h-px bg-muted" {...props} />;
}

