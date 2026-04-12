import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MultiSelect({ options = [], selected = [], onSelectedChange, placeholder = "Auswählen..." }) {
  const [open, setOpen] = useState(false);

  const toggle = (value) => {
    if (selected.includes(value)) {
      onSelectedChange(selected.filter((v) => v !== value));
    } else {
      onSelectedChange([...selected, value]);
    }
  };

  const remove = (e, value) => {
    e.stopPropagation();
    onSelectedChange(selected.filter((v) => v !== value));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between h-auto min-h-9 px-3 py-1.5 font-normal"
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {selected.map((val) => {
              const opt = options.find((o) => o.value === val);
              return (
                <Badge key={val} variant="secondary" className="text-xs px-1.5 py-0.5 gap-1">
                  {opt?.label || val}
                  <X className="h-3 w-3 cursor-pointer" onClick={(e) => remove(e, val)} />
                </Badge>
              );
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-1" align="start">
        {options.map((opt) => (
          <div
            key={opt.value}
            onClick={() => toggle(opt.value)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-accent",
              selected.includes(opt.value) && "bg-accent/50"
            )}
          >
            <Check className={cn("h-4 w-4", selected.includes(opt.value) ? "opacity-100" : "opacity-0")} />
            {opt.label}
          </div>
        ))}
        {options.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1.5">Keine Gruppen vorhanden</p>}
      </PopoverContent>
    </Popover>
  );
}