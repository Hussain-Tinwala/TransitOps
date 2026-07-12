// src/app/api/fuel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.fuelLog.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch fuel logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { vehicleId, liters, cost, date } = await req.json();

    if (!vehicleId || !liters || !cost) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        liters: Number(liters),
        cost: Number(cost),
        date: date ? new Date(date) : new Date(),
      },
      include: { vehicle: true }
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}