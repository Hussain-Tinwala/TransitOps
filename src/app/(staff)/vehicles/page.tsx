"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Plus, Truck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VehicleRegistryPage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/vehicles")
      .then((res) => res.json())
      .then((data) => {
        setVehicles(data);
        setLoading(false);
      });
  }, []);

  const handleAddVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      registrationNumber: formData.get("registrationNumber"),
      name: formData.get("name"),
      type: formData.get("type"),
      maxLoadCapacity: Number(formData.get("maxLoadCapacity")),
      odometer: Number(formData.get("odometer")),
      acquisitionCost: Number(formData.get("acquisitionCost")),
    };

    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      setSubmitError(error.error);
    } else {
      const newVehicle = await res.json();
      setVehicles([newVehicle, ...vehicles]);
      setShowForm(false);
      router.refresh();
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'ON_TRIP': return 'bg-blue-100 text-blue-700';
      case 'IN_SHOP': return 'bg-amber-100 text-amber-700';
      case 'RETIRED': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Vehicle Registry</h1>
          <p className="text-slate-500 mt-1">Manage fleet assets, capacities, and statuses.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </header>

      {/* Business Rule Note */}
      <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg flex gap-3 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p><strong>Business Rule Active:</strong> Retired or In Shop vehicles are automatically excluded from the Dispatcher's selection pool.</p>
      </div>

      {showForm && (
        <form onSubmit={handleAddVehicle} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 border-b pb-2">Register New Asset</h3>
          {submitError && <div className="text-red-600 text-sm">{submitError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required name="registrationNumber" placeholder="Registration No (e.g., VAN-99)" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <input required name="name" placeholder="Model Name" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <select required name="type" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Select Type...</option>
              <option value="Van">Van</option>
              <option value="Heavy Truck">Heavy Truck</option>
              <option value="Reefer">Reefer</option>
            </select>
            <input required type="number" name="maxLoadCapacity" placeholder="Max Capacity (kg)" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <input required type="number" name="odometer" placeholder="Current Odometer (km)" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <input required type="number" name="acquisitionCost" placeholder="Acquisition Cost ($)" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800">Save Asset</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flexible-table-container">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading registry...</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-slate-600 font-medium border-b border-gray-200">
              <tr>
                <th className="p-4">Reg No.</th>
                <th className="p-4">Model</th>
                <th className="p-4">Type</th>
                <th className="p-4">Capacity</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-900">{v.registrationNumber}</td>
                  <td className="p-4 text-slate-600">{v.name}</td>
                  <td className="p-4 text-slate-600">{v.type}</td>
                  <td className="p-4 text-slate-600">{v.maxLoadCapacity} kg</td>
                  <td className="p-4 text-slate-600">{v.odometer} km</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(v.status)}`}>
                      {v.status.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}