import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await context.params; // Await the params!
  try {
    const body = await req.json();
    const { action, finalOdometer, fuelConsumed } = body;
    
    // THIS WAS CRASHING: params must be awaited in Next 15!
    const params = await context.params;
    const tripId = params.id;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    if (action === "CANCEL") {
      await prisma.$transaction([
        prisma.trip.update({ where: { id: tripId }, data: { status: "CANCELLED" } }),
        prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }),
        prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
      ]);
      return NextResponse.json({ success: true });
    }

    if (action === "COMPLETE") {
      if (!finalOdometer || !fuelConsumed) {
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      await prisma.$transaction([
        prisma.trip.update({ 
          where: { id: tripId }, 
          data: { status: "COMPLETED", finalOdometer: Number(finalOdometer), fuelConsumed: Number(fuelConsumed) } 
        }),
        prisma.vehicle.update({ 
          where: { id: trip.vehicleId }, 
          data: { status: "AVAILABLE", odometer: Number(finalOdometer) } 
        }),
        prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
        prisma.fuelLog.create({
          data: { vehicleId: trip.vehicleId, liters: Number(fuelConsumed), cost: Number(fuelConsumed) * 1.5, date: new Date() }
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