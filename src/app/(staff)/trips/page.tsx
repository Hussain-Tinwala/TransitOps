// src/app/(staff)/trips/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSocket } from "@/components/SocketProvider";
import { AlertCircle, CheckCircle2, MapPin, Truck, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TripDispatcherPage() {
  const router = useRouter();
  const socket = useSocket();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [cargoWeight, setCargoWeight] = useState("");
  const [plannedDistance, setPlannedDistance] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const [activeTrips, setActiveTrips] = useState<any[]>([]);
  
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/vehicles").then(res => {
        if (!res.ok) throw new Error("Failed to fetch vehicles");
        return res.json();
      }),
      fetch("/api/drivers").then(res => {
        if (!res.ok) throw new Error("Failed to fetch drivers");
        return res.json();
      }),
      fetch("/api/trips").then(res => {
        if (!res.ok) throw new Error("Failed to fetch trips");
        return res.json();
      })
    ])
    .then(([vehiclesData, driversData, tripsData]) => {
      setVehicles(vehiclesData.filter((v: any) => v.status === "AVAILABLE"));
      setDrivers(driversData.filter((d: any) => d.status === "AVAILABLE" && new Date(d.licenseExpiryDate) > new Date()));
      setActiveTrips(tripsData.filter((t: any) => t.status === "DISPATCHED"));
      setLoading(false);
    })
    .catch(error => {
      console.error(error);
      setSubmitError("Failed to load resources. Please ensure API routes exist.");
      setLoading(false);
    });
  }, []);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const weight = Number(cargoWeight);
  const capacity = selectedVehicle ? Number(selectedVehicle.maxLoadCapacity) : 0;
  
  // Live Inline Validation
  const isOverweight = selectedVehicle && weight > capacity;
  const overweightAmount = isOverweight ? weight - capacity : 0;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOverweight) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          destination,
          cargoWeight: weight,
          plannedDistance: Number(plannedDistance),
          vehicleId: selectedVehicleId,
          driverId: selectedDriverId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error);
      } else {
        setSource("");
        setDestination("");
        setCargoWeight("");
        setPlannedDistance("");
        setSelectedVehicleId("");
        setSelectedDriverId("");
        
        // Remove used vehicle/driver locally to prevent double-booking before socket syncs
        setVehicles(prev => prev.filter(v => v.id !== selectedVehicleId));
        setDrivers(prev => prev.filter(d => d.id !== selectedDriverId));

        // CRITICAL: Trigger the global real-time update
        socket?.emit("state_changed");
        router.refresh(); 
      }
    } catch (err) {
      setSubmitError("Network error occurred.");
    } finally {
      // CRITICAL: Unlocks the button whether it succeeds or fails
      setIsSubmitting(false); 
    }
  };

  const handleComplete = async (tripId: string) => {
    const odo = prompt("Enter final odometer reading (km):");
    if (!odo) return;
    const fuel = prompt("Enter total fuel consumed (Liters):");
    if (!fuel) return;

    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "COMPLETE", finalOdometer: odo, fuelConsumed: fuel })
    });
    
    if (res.ok) {
      socket?.emit("state_changed");
      setActiveTrips(prev => prev.filter(t => t.id !== tripId)); // Hides it instantly
      router.refresh();
    } else {
      alert("Failed to complete trip.");
    }
  };

  const handleCancel = async (tripId: string) => {
    if (!confirm("Are you sure you want to cancel this trip?")) return;

    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "CANCEL" })
    });
    
    if (res.ok) {
      socket?.emit("state_changed");
      setActiveTrips(prev => prev.filter(t => t.id !== tripId)); // Hides it instantly
      router.refresh();
    } else {
      alert("Failed to cancel trip.");
    }
  };

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading dispatch terminal...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Trip Dispatcher</h1>
        <p className="text-slate-500 mt-1">Assign available vehicles and drivers to new routes.</p>
      </header>

      {/* Stepper UI */}
      <div className="flex items-center justify-between mb-8 pb-8 border-b border-gray-200">
        {["Draft", "Dispatched", "Completed", "Cancelled"].map((step, index) => (
          <div key={step} className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? "bg-amber-500 text-slate-900" : "bg-gray-100 text-gray-400"}`}>
              {index + 1}
            </div>
            <span className={`text-sm font-medium ${index === 0 ? "text-slate-900" : "text-gray-400"}`}>{step}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleDispatch} className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 border-b border-gray-100 pb-4">Create New Trip</h3>
        
        {submitError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex gap-3 text-sm border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4"/> Source</label>
            <input required type="text" value={source} onChange={(e) => setSource(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Warehouse A" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><MapPin className="w-4 h-4"/> Destination</label>
            <input required type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="Client Hub North" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><Truck className="w-4 h-4"/> Assign Vehicle</label>
            <select required value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
              <option value="" disabled>Select available vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.registrationNumber} ({v.type}) - Cap: {v.maxLoadCapacity}kg</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2"><User className="w-4 h-4"/> Assign Driver</label>
            <select required value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
              <option value="" disabled>Select available driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name} (Score: {d.safetyScore})</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Cargo Weight (kg)</label>
            <input required type="number" min="1" value={cargoWeight} onChange={(e) => setCargoWeight(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="450" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Planned Distance (km)</label>
            <input required type="number" min="1" value={plannedDistance} onChange={(e) => setPlannedDistance(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="150" />
          </div>
        </div>

        {/* Live Validation Banner matches mockup exact wording */}
        {isOverweight && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Dispatch Blocked</p>
              <p>Vehicle Capacity {capacity} kg, Cargo Weight {weight} kg. Capacity exceeded by {overweightAmount} kg.</p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting || isOverweight || !selectedVehicleId || !selectedDriverId}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Dispatching..." : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Confirm & Dispatch
              </>
            )}
          </button>
        </div>
      </form>

      {/* Active Trips Management */}
      <div className="mt-12 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 font-semibold text-slate-800">
          Manage Active Trips
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-slate-500">
              <tr>
                <th className="p-4">Route</th>
                <th className="p-4">Vehicle</th>
                <th className="p-4">Driver</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTrips.map((trip: any) => (
                <tr key={trip.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-slate-900">{trip.source} → {trip.destination}</td>
                  <td className="p-4 text-slate-600">{trip.vehicle.registrationNumber}</td>
                  <td className="p-4 text-slate-600">{trip.driver.name}</td>
                  <td className="p-4 text-right space-x-3">
                    <button 
                      onClick={() => handleComplete(trip.id)}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Complete
                    </button>
                    <button 
                      onClick={() => handleCancel(trip.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
              {activeTrips.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400">No active trips requiring management.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}