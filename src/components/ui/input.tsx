import * as React from "react";
import { cn } from "@/lib/utils";

const campo = cn(
  "w-full rounded-md border border-input bg-background px-3 text-sm text-foreground",
  "placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  "transition-colors duration-(--duracao) ease-(--curva) aria-invalid:border-erro",
);

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return <input data-slot="input" type={type} className={cn(campo, "h-10", className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea data-slot="textarea" className={cn(campo, "min-h-20 py-2", className)} {...props} />;
}

/** `<select>` nativo com a cara dos campos. */
function Select({ className, ...props }: React.ComponentProps<"select">) {
  return <select data-slot="select" className={cn(campo, "h-10 pr-8", className)} {...props} />;
}

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return <label data-slot="label" className={cn("text-sm font-medium text-foreground", className)} {...props} />;
}

export { Input, Textarea, Select, Label };
