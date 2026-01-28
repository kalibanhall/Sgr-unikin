import { TableSkeleton } from "@/components/ui/skeleton";

export default function EtudiantsLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="h-12 w-full max-w-md bg-slate-200 rounded-lg animate-pulse" />
      
      {/* Table */}
      <TableSkeleton rows={8} />
    </div>
  );
}
