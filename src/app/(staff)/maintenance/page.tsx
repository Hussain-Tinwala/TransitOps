// src/app/(staff)/maintenance/page.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Wrench, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";

export default function MaintenancePage() {
  const router = useRouter();
  const socket = useSocket();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [vehicleId, setVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [cost, setCost] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/maintenance").then(res => res.json()),
      fetch("/api/vehicles").then(res => res.json())
    ]).then(([logsData, vehiclesData]) => {
      setLogs(logsData);
      // Only show vehicles that are NOT already in the shop or retired
      setVehicles(vehiclesData.filter((v: any) => v.status !== "IN_SHOP" && v.status !== "RETIRED"));
      setLoading(false);
    });
  }, []);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, serviceType, cost }),
    });

    if (res.ok) {
      const newLog = await res.json();
      setLogs([newLog, ...logs]);
      setVehicleId("");
      setServiceType("");
      setCost("");
      
      // TRIGGER REAL-TIME SYNC
      socket?.emit("state_changed");
      router.refresh();
      
      // Remove from local dropdown list
      setVehicles(prev => prev.filter(v => v.id !== newLog.vehicleId));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Maintenance Logs</h1>
        <p className="text-slate-500 mt-1">Track vehicle repairs and automatically update availability statuses.</p>
      </header>

      <div className="bg-amber-50 border border-amber-100 text-amber-800 p-4 rounded-lg flex gap-3 text-sm mb-6">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p><strong>Workflow Automation:</strong> Logging a vehicle for maintenance will instantly switch its status to <em>IN_SHOP</em> and remove it from the active dispatch pool globally.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleCreateLog} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 border-b pb-3">
              <Wrench className="w-5 h-5 text-amber-500" /> Log Service
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Vehicle</label>
              <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white outline-none">
                <option value="" disabled>Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.registrationNumber} ({v.name})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Service Type</label>
              <input required value={serviceType} onChange={e => setServiceType(e.target.value)} placeholder="e.g., Oil Change, Brake Pad Replacement" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Cost ($)</label>
              <input required type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="450.00" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>

            <button disabled={isSubmitting || !vehicleId} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
              {isSubmitting ? "Logging..." : "Submit Log"}
            </button>
          </form>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-slate-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Cost</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="p-4 text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="p-4 font-semibold text-slate-900">{log.vehicle.registrationNumber}</td>
                      <td className="p-4 text-slate-600">{log.serviceType}</td>
                      <td className="p-4 text-slate-900 font-medium">${Number(log.cost).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${log.status === 'ACTIVE' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">No maintenance logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}