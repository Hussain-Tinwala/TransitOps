// src/app/api/trips/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tripSchema } from "@/lib/validations";

export async function GET() {
  const trips = await prisma.trip.findMany({
    include: {
      vehicle: true,
      driver: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(trips);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const result = tripSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 });
    }

    const { source, destination, cargoWeight, plannedDistance, vehicleId, driverId } = result.data;

    // Fetch related entities to enforce business rules
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

    if (!vehicle || !driver) {
      return NextResponse.json({ error: "Vehicle or Driver not found" }, { status: 404 });
    }

    // BUSINESS RULE: Vehicle must be available
    if (vehicle.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Vehicle is not available for dispatch." }, { status: 400 });
    }

    // BUSINESS RULE: Driver must be available and license valid
    if (driver.status !== "AVAILABLE") {
      return NextResponse.json({ error: "Driver is not available for dispatch." }, { status: 400 });
    }
    if (new Date(driver.licenseExpiryDate) < new Date()) {
      return NextResponse.json({ error: "Driver's license is expired." }, { status: 400 });
    }

    // BUSINESS RULE: Cargo weight validation
    if (Number(cargoWeight) > Number(vehicle.maxLoadCapacity)) {
      return NextResponse.json({ 
        error: `Capacity exceeded by ${Number(cargoWeight) - Number(vehicle.maxLoadCapacity)} kg.` 
      }, { status: 400 });
    }

    // Q&A HIGHLIGHT: Atomic Transaction
    // We use Prisma $transaction to ensure that if any of these updates fail (e.g., database crash), 
    // the entire operation rolls back. This prevents orphaned trips or vehicles stuck in the wrong state.
    const [trip] = await prisma.$transaction([
      prisma.trip.create({
        data: {
          source,
          destination,
          cargoWeight,
          plannedDistance,
          status: "DISPATCHED", // Auto-dispatch per requirements
          vehicleId,
          driverId,
        },
        include: { vehicle: true, driver: true }
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "ON_TRIP" },
      }),
      prisma.driver.update({
        where: { id: driverId },
        data: { status: "ON_TRIP" },
      }),
    ]);

    return NextResponse.json(trip, { status: 201 });
  } catch (error) {
    console.error("Trip creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}