"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-3", className)} {...props} />;
}

/** Abas com linha embaixo; a ativa ganha uma barra de 2px de tinta. */
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List data-slot="tabs-list" className={cn("flex w-full flex-wrap items-center gap-1 border-b border-border", className)} {...props} />;
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative -mb-px inline-flex h-10 items-center justify-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap text-muted-foreground",
        "transition-colors duration-(--duracao) ease-(--curva)",
        "hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-transparent after:transition-colors",
        "data-[state=active]:text-foreground data-[state=active]:after:bg-primary",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
