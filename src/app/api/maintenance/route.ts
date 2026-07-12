// src/app/api/maintenance/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.maintenanceLog.findMany({
      include: { vehicle: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { vehicleId, serviceType, cost } = await req.json();

    if (!vehicleId || !serviceType || !cost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // BUSINESS RULE: Atomic transaction to create log AND update vehicle status to IN_SHOP
    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId,
          serviceType,
          cost: Number(cost),
          status: "ACTIVE",
        },
        include: { vehicle: true }
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_SHOP" },
      }),
    ]);

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("Maintenance creation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}