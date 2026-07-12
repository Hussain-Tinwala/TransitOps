"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/drivers")
      .then((res) => res.json())
      .then((data) => {
        setDrivers(data);
        setLoading(false);
      });
  }, []);

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);
    const formData = new FormData(e.currentTarget);
    
    const payload = {
      name: formData.get("name"),
      licenseNumber: formData.get("licenseNumber"),
      licenseCategory: formData.get("licenseCategory"),
      licenseExpiryDate: formData.get("licenseExpiryDate"),
      contactNumber: formData.get("contactNumber"),
      safetyScore: Number(formData.get("safetyScore")),
    };

    const res = await fetch("/api/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      setSubmitError(error.error);
    } else {
      const newDriver = await res.json();
      setDrivers([newDriver, ...drivers]);
      setShowForm(false);
      router.refresh();
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700';
      case 'ON_TRIP': return 'bg-blue-100 text-blue-700';
      case 'OFF_DUTY': return 'bg-gray-100 text-gray-700';
      case 'SUSPENDED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Drivers & Safety Profiles</h1>
          <p className="text-slate-500 mt-1">Monitor compliance, safety scores, and duty status.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </header>

      {/* Business Rule Note */}
      <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-lg flex gap-3 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p><strong>Business Rule Active:</strong> Drivers with expired licenses or Suspended status are blocked from new trips.</p>
      </div>

      {showForm && (
        <form onSubmit={handleAddDriver} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-800 border-b pb-2">Register New Driver</h3>
          {submitError && <div className="text-red-600 text-sm">{submitError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input required name="name" placeholder="Full Name" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <input required name="licenseNumber" placeholder="License Number" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <select required name="licenseCategory" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">Select Category...</option>
              <option value="Commercial">Commercial</option>
              <option value="Heavy">Heavy</option>
            </select>
            <input required type="date" name="licenseExpiryDate" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500 text-gray-500" />
            <input required name="contactNumber" placeholder="Contact Number" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
            <input required type="number" step="0.1" name="safetyScore" placeholder="Safety Score (0-100)" className="p-2 border rounded-md outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-md hover:bg-slate-800">Save Driver</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flexible-table-container">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading profiles...</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-slate-600 font-medium border-b border-gray-200">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">License No.</th>
                <th className="p-4">Expiry Date</th>
                <th className="p-4">Safety Score</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.map((d) => {
                const isExpired = new Date(d.licenseExpiryDate) < new Date();
                return (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{d.name}</td>
                    <td className="p-4 text-slate-600">{d.licenseNumber}</td>
                    <td className="p-4 text-slate-600">
                      <span className={isExpired ? "text-red-600 font-semibold" : ""}>
                        {new Date(d.licenseExpiryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">{d.safetyScore} / 100</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(d.status)}`}>
                        {d.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}