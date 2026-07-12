// src/app/api/trips/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { action, finalOdometer, fuelConsumed } = body;
    const tripId = params.id;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    if (action === "CANCEL") {
      // Atomic rollback to AVAILABLE
      await prisma.$transaction([
        prisma.trip.update({ where: { id: tripId }, data: { status: "CANCELLED" } }),
        prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }),
        prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
      ]);
      return NextResponse.json({ success: true });
    }

    if (action === "COMPLETE") {
      if (!finalOdometer || !fuelConsumed) {
        return NextResponse.json({ error: "Final odometer and fuel are required to complete a trip" }, { status: 400 });
      }

      // Q&A HIGHLIGHT: Atomic completion. We update the trip status, free up the assets, 
      // AND automatically update the vehicle's master odometer in one single database transaction.
      await prisma.$transaction([
        prisma.trip.update({ 
          where: { id: tripId }, 
          data: { 
            status: "COMPLETED",
            finalOdometer: Number(finalOdometer),
            fuelConsumed: Number(fuelConsumed)
          } 
        }),
        prisma.vehicle.update({ 
          where: { id: trip.vehicleId }, 
          data: { 
            status: "AVAILABLE",
            odometer: Number(finalOdometer) // Automatically updates master odometer
          } 
        }),
        prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
        
        // Bonus automation: Automatically log the fuel used as a FuelLog for financial tracking!
        prisma.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            liters: Number(fuelConsumed),
            cost: Number(fuelConsumed) * 1.5, // Assumed average cost per liter for auto-logging
            date: new Date()
          }
        })
      ]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Trip update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}