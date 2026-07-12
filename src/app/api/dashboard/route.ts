// src/app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [vehicles, drivers, trips] = await Promise.all([
      prisma.vehicle.findMany({ where: { isActive: true } }),
      prisma.driver.findMany({ where: { isActive: true } }),
      prisma.trip.findMany({
        include: { vehicle: true, driver: true },
        orderBy: { createdAt: "desc" },
        take: 5 // Get only recent activity for the dashboard
      })
    ]);

    const activeVehiclesCount = vehicles.filter(v => v.status !== "RETIRED").length;
    const onTripCount = vehicles.filter(v => v.status === "ON_TRIP").length;

    const stats = {
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.status === "AVAILABLE").length,
      inMaintenance: vehicles.filter(v => v.status === "IN_SHOP").length,
      activeTrips: trips.filter(t => t.status === "DISPATCHED").length,
      pendingTrips: trips.filter(t => t.status === "DRAFT").length,
      driversOnDuty: drivers.filter(d => d.status === "ON_TRIP").length,
      fleetUtilization: activeVehiclesCount > 0 ? (onTripCount / activeVehiclesCount) * 100 : 0,
      
      vehicleStatusDistribution: {
        AVAILABLE: vehicles.filter(v => v.status === "AVAILABLE").length,
        ON_TRIP: onTripCount,
        IN_SHOP: vehicles.filter(v => v.status === "IN_SHOP").length,
        RETIRED: vehicles.filter(v => v.status === "RETIRED").length,
      },
      
      recentTrips: trips
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard aggregation error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}