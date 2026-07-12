// src/app/(staff)/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/SocketProvider";
import { Activity, Truck, Filter } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const socket = useSocket();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [regionFilter, setRegionFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchDashboardData = () => {
    // Pass filters as query parameters
    const query = new URLSearchParams({
      region: regionFilter,
      type: typeFilter,
      status: statusFilter
    }).toString();

    fetch(`/api/dashboard?${query}`)
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  };

  // Re-fetch when filters change
  useEffect(() => {
    fetchDashboardData();
  }, [regionFilter, typeFilter, statusFilter]);

  // Real-time socket sync
  useEffect(() => {
    if (!socket) return;
    socket.on("refresh_data", () => fetchDashboardData());
    return () => { socket.off("refresh_data"); };
  }, [socket, regionFilter, typeFilter, statusFilter]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading live fleet metrics...</div>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end border-b border-gray-200 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {session?.user?.name}. Live operations overview.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          System Status: Optimal
        </div>
      </header>

      {/* THE FILTERS ODOO REQUESTED */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Filter className="w-4 h-4" /> Filters:
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500">
          <option value="ALL">All Regions</option>
          <option value="North">North</option>
          <option value="South">South</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500">
          <option value="ALL">All Vehicle Types</option>
          <option value="Van">Van</option>
          <option value="Heavy Truck">Heavy Truck</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="p-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500">
          <option value="ALL">All Statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option>
        </select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Filtered Vehicles", val: stats.totalVehicles },
          { label: "Available", val: stats.availableVehicles },
          { label: "Drivers On Duty", val: stats.driversOnDuty },
          { label: "Fleet Utilization", val: `${stats.fleetUtilization.toFixed(1)}%` },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <h3 className="text-slate-500 text-sm font-medium">{kpi.label}</h3>
            <div className="text-3xl font-bold text-slate-900 mt-2">{kpi.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center gap-2 font-semibold text-slate-800">
            <Activity className="w-4 h-4 text-blue-500" /> Recent Trip Activity
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 text-slate-500">
                <tr>
                  <th className="p-4">Route</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.recentTrips.map((trip: any) => (
                  <tr key={trip.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-slate-900">{trip.source} → {trip.destination}</td>
                    <td className="p-4 text-slate-600">{trip.vehicle.registrationNumber}</td>
                    <td className="p-4 text-slate-600">{trip.driver.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        trip.status === 'DISPATCHED' ? 'bg-blue-100 text-blue-700' :
                        trip.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CSS Native Status Chart */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 font-semibold text-slate-800 mb-6">
            <Truck className="w-4 h-4 text-amber-500" /> Filtered Status Distribution
          </div>
          
          <div className="space-y-4 flex-1">
            {[
              { label: "Available", count: stats.vehicleStatusDistribution.AVAILABLE, color: "bg-emerald-500" },
              { label: "On Trip", count: stats.vehicleStatusDistribution.ON_TRIP, color: "bg-blue-500" },
              { label: "In Shop", count: stats.vehicleStatusDistribution.IN_SHOP, color: "bg-amber-500" },
              { label: "Retired", count: stats.vehicleStatusDistribution.RETIRED, color: "bg-gray-400" },
            ].map(stat => {
              const total = stats.totalVehicles || 1;
              const percentage = (stat.count / total) * 100;
              return (
                <div key={stat.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{stat.label}</span>
                    <span className="text-slate-500">{stat.count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${stat.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}