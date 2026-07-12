"use client";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {session?.user?.name}. Here is today's overview.
          </p>
        </div>
        <div className="text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          System Status: <span className="text-emerald-500">Optimal</span>
        </div>
      </header>

      {/* KPI Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["Active Vehicles", "Available Vehicles", "Drivers On Duty", "Pending Trips"].map((kpi) => (
          <div key={kpi} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <h3 className="text-slate-500 text-sm font-medium">{kpi}</h3>
            <div className="text-3xl font-bold text-slate-900">--</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-h-[300px]">
          <h3 className="text-slate-800 font-semibold mb-4">Recent Activity</h3>
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
            Live socket events will populate here
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 min-h-[300px]">
          <h3 className="text-slate-800 font-semibold mb-4">Fleet Utilization</h3>
          <div className="flex items-center justify-center h-48 text-slate-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
            Chart rendering...
          </div>
        </div>
      </div>
    </div>
  );
}