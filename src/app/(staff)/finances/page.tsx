// src/app/(staff)/finances/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Calculator, Droplets, Receipt, Plus } from "lucide-react";
import { useSocket } from "@/components/SocketProvider";

export default function FinancesPage() {
  const socket = useSocket();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [activeTab, setActiveTab] = useState<"FUEL" | "EXPENSE">("FUEL");
  const [vehicleId, setVehicleId] = useState("");
  const [liters, setLiters] = useState("");
  const [cost, setCost] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    const [vehRes, fuelRes, expRes, maintRes] = await Promise.all([
      fetch("/api/vehicles").then(r => r.json()),
      fetch("/api/fuel").then(r => r.json()),
      fetch("/api/expenses").then(r => r.json()),
      fetch("/api/maintenance").then(r => r.json())
    ]);
    setVehicles(vehRes);
    setFuelLogs(fuelRes);
    setExpenses(expRes);
    setMaintenanceLogs(maintRes);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (activeTab === "FUEL") {
      await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, liters, cost }),
      });
    } else {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId, type: expenseType, amount: cost }),
      });
    }

    setVehicleId("");
    setLiters("");
    setCost("");
    setExpenseType("");
    
    await fetchData(); // Refresh local tables
    socket?.emit("state_changed"); // Sync dashboard
    setIsSubmitting(false);
  };

  // Calculate Total Operational Cost (Fuel + Maintenance) per vehicle
  const calculateOperationalCosts = () => {
    return vehicles.map(v => {
      const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((sum, f) => sum + Number(f.cost), 0);
      const vMaint = maintenanceLogs.filter(m => m.vehicleId === v.id).reduce((sum, m) => sum + Number(m.cost), 0);
      return {
        ...v,
        totalFuelCost: vFuel,
        totalMaintCost: vMaint,
        operationalCost: vFuel + vMaint
      };
    }).filter(v => v.operationalCost > 0).sort((a, b) => b.operationalCost - a.operationalCost);
  };

  const operationalCosts = calculateOperationalCosts();

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading financial data...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fuel & Expense Management</h1>
        <p className="text-slate-500 mt-1">Track fleet spending and automatically compute operational costs.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
              <button onClick={() => setActiveTab("FUEL")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "FUEL" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}>Fuel Log</button>
              <button onClick={() => setActiveTab("EXPENSE")} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "EXPENSE" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-slate-700"}`}>Other Expense</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Vehicle</label>
                <select required value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white outline-none">
                  <option value="" disabled>Select vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} ({v.name})</option>
                  ))}
                </select>
              </div>

              {activeTab === "FUEL" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Liters</label>
                  <input required type="number" step="0.1" value={liters} onChange={e => setLiters(e.target.value)} placeholder="45.5" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Expense Type</label>
                  <input required value={expenseType} onChange={e => setExpenseType(e.target.value)} placeholder="e.g., Toll, Cleaning, Fine" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Total Cost ($)</label>
                <input required type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} placeholder="120.50" className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-medium transition-colors flex justify-center items-center gap-2">
                <Plus className="w-4 h-4" /> {isSubmitting ? "Saving..." : `Add ${activeTab === "FUEL" ? "Fuel" : "Expense"} Log`}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Dynamic KPIs and Tables */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Operational Cost KPI Box (Mandatory Requirement) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-sm text-white">
            <h3 className="font-semibold flex items-center gap-2 mb-4 text-slate-300">
              <Calculator className="w-5 h-5 text-amber-500" /> 
              Total Operational Cost (Fuel + Maintenance)
            </h3>
            <div className="space-y-3">
              {operationalCosts.length === 0 ? (
                <p className="text-sm text-slate-500">No costs recorded yet.</p>
              ) : (
                operationalCosts.map(v => (
                  <div key={v.id} className="flex justify-between items-center pb-2 border-b border-slate-800 last:border-0 last:pb-0">
                    <div>
                      <span className="font-medium">{v.registrationNumber}</span>
                      <span className="text-xs text-slate-500 ml-2">({v.name})</span>
                    </div>
                    <div className="font-mono text-amber-400 font-semibold">
                      ${v.operationalCost.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Logs Tables */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-semibold text-slate-800 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" /> Recent Fuel Logs
            </div>
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Liters</th>
                  <th className="p-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {fuelLogs.slice(0, 3).map((log) => (
                  <tr key={log.id}>
                    <td className="p-3 text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-slate-900">{log.vehicle?.registrationNumber}</td>
                    <td className="p-3 text-slate-600">{log.liters} L</td>
                    <td className="p-3 font-medium text-slate-900">${Number(log.cost).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}