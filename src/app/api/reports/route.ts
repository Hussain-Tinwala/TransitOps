// src/app/api/reports/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      include: {
        trips: true,
        maintenanceLogs: true,
        fuelLogs: true,
      }
    });

    let totalFleetRevenue = 0;
    let totalFleetOpCost = 0;
    let vehiclesOnTrip = 0;

    const vehicleStats = vehicles.map(v => {
      // 1. Calculate Revenue (Sum of all trip revenues for this vehicle)
      const revenue = v.trips.reduce((sum, trip) => sum + Number(trip.revenue || 0), 0);
      
      // 2. Calculate Costs
      const maintCost = v.maintenanceLogs.reduce((sum, log) => sum + Number(log.cost), 0);
      const fuelCost = v.fuelLogs.reduce((sum, log) => sum + Number(log.cost), 0);
      const opCost = maintCost + fuelCost;

      // 3. Calculate Efficiency (Distance / Fuel)
      const totalDistance = v.trips.reduce((sum, trip) => sum + Number(trip.plannedDistance), 0);
      const totalFuel = v.fuelLogs.reduce((sum, log) => sum + Number(log.liters), 0);
      
      // Q&A HIGHLIGHT: Fallback to 0 prevents NaN/Infinity errors if a vehicle has no logs yet.
      const efficiency = totalFuel > 0 ? (totalDistance / totalFuel) : 0; 

      // 4. Calculate ROI based on the exact prompt formula: [Revenue - (Maintenance + Fuel)] / Acquisition Cost
      const acqCost = Number(v.acquisitionCost);
      const roi = acqCost > 0 ? ((revenue - opCost) / acqCost) * 100 : 0;

      // Track global totals for the KPI cards
      totalFleetRevenue += revenue;
      totalFleetOpCost += opCost;
      if (v.status === "ON_TRIP") vehiclesOnTrip++;

      return {
        id: v.id,
        reg: v.registrationNumber,
        name: v.name,
        revenue,
        opCost,
        maintCost,
        fuelCost,
        efficiency,
        roi,
        status: v.status
      };
    });

    // Fleet Utilization: (Vehicles currently On Trip / Total active vehicles) * 100
    const activeVehicles = vehicles.filter(v => v.status !== "RETIRED").length;
    const fleetUtilization = activeVehicles > 0 ? (vehiclesOnTrip / activeVehicles) * 100 : 0;

    return NextResponse.json({
      global: {
        fleetUtilization,
        totalFleetOpCost,
        totalFleetRevenue,
        netProfit: totalFleetRevenue - totalFleetOpCost
      },
      vehicleStats: vehicleStats.sort((a, b) => b.roi - a.roi) // Sort by highest ROI
    });

  } catch (error) {
    console.error("Reports aggregation error:", error);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}