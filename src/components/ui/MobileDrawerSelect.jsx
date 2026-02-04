import React, { useState } from 'react';
import { Check } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export function MobileDrawerSelect({ 
  value, 
  onValueChange, 
  options = [], 
  placeholder = "Select...",
  trigger,
  label 
}) {
  const [open, setOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  const handleSelect = (optionValue) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <button className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
            <span className={cn(!selectedOption && "text-slate-500 dark:text-slate-400")}>
              {selectedOption?.label || placeholder}
            </span>
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </DrawerTrigger>
      <DrawerContent className="dark:bg-slate-800">
        <DrawerHeader>
          <DrawerTitle className="dark:text-slate-100">{label || placeholder}</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-8 max-h-[60vh] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={cn(
                "flex items-center justify-between w-full min-h-[44px] px-4 py-3 text-left rounded-lg transition-colors select-none",
                value === option.value 
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                  : "hover:bg-slate-100 dark:hover:bg-slate-700 dark:text-slate-200"
              )}
            >
              <span>{option.label}</span>
              {value === option.value && <Check className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}