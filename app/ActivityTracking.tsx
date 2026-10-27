"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { activityConfigured, stopActivityCollection, trackActivity } from "@/lib/activity-client";
import type { FilterCategory } from "@/lib/activity-contract";

export function ActivityTracking({ allowed }: { allowed: boolean }) {
  const pathname = usePathname();
  const lastPage = useRef<string | null>(null);
  useEffect(() => {
    if (!allowed) { lastPage.current = null; stopActivityCollection(); return; }
    if (lastPage.current === pathname) return;
    lastPage.current = pathname;
    trackActivity("page_view");
  }, [allowed, pathname]);
  return null;
}

// Values stay in this component's memory. Only changed category names and a
// coarse result bucket are passed to the allowlisted sender.
export function useBoardActivity(ready: boolean, resultCount: number, values: Record<FilterCategory, string>) {
  const previous = useRef<Record<FilterCategory, string> | null>(null);
  const pending = useRef(new Set<FilterCategory>());
  const serialized = JSON.stringify(values);
  useEffect(() => {
    if (!ready || !activityConfigured) return;
    const current = JSON.parse(serialized) as Record<FilterCategory, string>;
    if (!previous.current) {
      if (current.role !== ":") pending.current.add("role");
    } else {
      for (const key of Object.keys(current) as FilterCategory[]) {
        if (previous.current[key] !== current[key]) pending.current.add(key);
      }
    }
    previous.current = current;
    if (!pending.current.size) return;
    const timer = window.setTimeout(() => {
      pending.current.forEach((key) => trackActivity("filter_use", key, resultCount));
      pending.current.clear();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [ready, resultCount, serialized]);
}
