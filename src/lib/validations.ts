// src/lib/validations.ts
import { z } from "zod";

export const vehicleSchema = z.object({
  registrationNumber: z.string().min(1, "Registration number is required"),
  name: z.string().min(1, "Vehicle name is required"),
  type: z.string().min(1, "Vehicle type is required"),
  maxLoadCapacity: z.coerce.number().min(1, "Capacity must be greater than 0"),
  odometer: z.coerce.number().min(0, "Odometer cannot be negative"),
  acquisitionCost: z.coerce.number().min(0, "Cost cannot be negative"),
});

export const driverSchema = z.object({
  name: z.string().min(1, "Driver name is required"),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseCategory: z.string().min(1, "License category is required"),
  licenseExpiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  contactNumber: z.string().min(1, "Contact number is required"),
  safetyScore: z.coerce.number().min(0).max(100, "Score must be between 0 and 100"),
});

export const tripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoWeight: z.coerce.number().min(1, "Cargo weight must be greater than 0"),
  plannedDistance: z.coerce.number().min(1, "Distance must be greater than 0"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
});