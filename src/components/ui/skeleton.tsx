"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200",
        className
      )}
    />
  );
}

// Skeleton pour une carte
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-2xl border bg-white p-6 shadow-sm", className)}>
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// Skeleton pour une liste
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white border">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// Skeleton pour le tableau de bord
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white p-6 border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <Skeleton className="h-8 w-20 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton className="h-96" />
        </div>
        <div>
          <CardSkeleton className="h-96" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour les documents
export function DocumentsSkeleton() {
  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Profile Header */}
      <div className="rounded-3xl bg-white p-8 border shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <Skeleton className="h-28 w-28 rounded-full mb-4" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </div>

      {/* Document Categories */}
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i}>
          <div className="flex items-center gap-3 mb-5">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="rounded-2xl border-2 border-dashed p-4 min-h-35">
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex items-center justify-center gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton pour la table admin
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Header */}
      <div className="border-b bg-slate-50 p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b p-4 last:border-0">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-8" />
            <div className="flex items-center gap-2 flex-1">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton pour le formulaire de connexion
export function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
        <Skeleton className="h-8 w-40 mx-auto mb-2" />
        <Skeleton className="h-4 w-56 mx-auto mb-8" />
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg mt-6" />
        </div>
      </div>
    </div>
  );
}

// Skeleton pour le profil
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="rounded-2xl bg-white p-6 border shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
          <Skeleton className="h-32 w-32 rounded-full" />
          <div className="space-y-3 text-center md:text-left">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
