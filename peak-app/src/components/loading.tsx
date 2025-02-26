"use client";
import { Skeleton } from "@/components/ui/skeleton";

export function Loading() {
  return (
    <div className="w-full h-screen p-4 space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-[200px]" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Main content area skeleton */}
      <div className="grid gap-6">
        {/* Title section */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <Skeleton className="h-8 w-[150px]" />
          <Skeleton className="h-8 w-[100px]" />
        </div>
      </div>
    </div>
  );
}
