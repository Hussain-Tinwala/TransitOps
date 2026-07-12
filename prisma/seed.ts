import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Users (Password is 'password123' for all)
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const roles = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] as const;
  
  for (const role of roles) {
    await prisma.user.upsert({
      where: { email: `${role.toLowerCase()}@transitops.com` },
      update: {},
      create: {
        name: `Test ${role}`,
        email: `${role.toLowerCase()}@transitops.com`,
        password: hashedPassword,
        role: role,
      },
    });
  }

  // 2. Create Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: { registrationNumber: 'VAN-05', name: 'Ford Transit', type: 'Van', maxLoadCapacity: 500, odometer: 15000, acquisitionCost: 35000, status: 'AVAILABLE' }
    }),
    prisma.vehicle.create({
      data: { registrationNumber: 'TRK-01', name: 'Volvo FH16', type: 'Heavy Truck', maxLoadCapacity: 25000, odometer: 120000, acquisitionCost: 150000, status: 'AVAILABLE' }
    }),
    prisma.vehicle.create({
      data: { registrationNumber: 'VAN-02', name: 'Mercedes Sprinter', type: 'Van', maxLoadCapacity: 1200, odometer: 45000, acquisitionCost: 42000, status: 'ON_TRIP' }
    }),
    prisma.vehicle.create({
      data: { registrationNumber: 'TRK-09', name: 'Scania R500', type: 'Heavy Truck', maxLoadCapacity: 20000, odometer: 85000, acquisitionCost: 130000, status: 'IN_SHOP' }
    }),
    prisma.vehicle.create({
      data: { registrationNumber: 'VAN-99', name: 'Old Chevy', type: 'Van', maxLoadCapacity: 800, odometer: 300000, acquisitionCost: 15000, status: 'RETIRED' }
    })
  ]);

  // 3. Create Drivers
  const drivers = await Promise.all([
    prisma.driver.create({
      data: { name: 'Alex', licenseNumber: 'DL-ALEX-001', licenseCategory: 'Commercial', licenseExpiryDate: new Date('2028-12-31'), contactNumber: '555-0101', safetyScore: 98.5, status: 'AVAILABLE' }
    }),
    prisma.driver.create({
      data: { name: 'Sarah Jenkins', licenseNumber: 'DL-SARAH-002', licenseCategory: 'Commercial', licenseExpiryDate: new Date('2029-05-15'), contactNumber: '555-0102', safetyScore: 95.0, status: 'AVAILABLE' }
    }),
    prisma.driver.create({
      data: { name: 'Mike Ross', licenseNumber: 'DL-MIKE-003', licenseCategory: 'Heavy', licenseExpiryDate: new Date('2027-11-20'), contactNumber: '555-0103', safetyScore: 92.0, status: 'ON_TRIP' }
    }),
    prisma.driver.create({
      data: { name: 'John Doe (Expired)', licenseNumber: 'DL-JOHN-004', licenseCategory: 'Commercial', licenseExpiryDate: new Date('2025-01-01'), contactNumber: '555-0104', safetyScore: 80.0, status: 'AVAILABLE' }
    }),
    prisma.driver.create({
      data: { name: 'Jane Smith (Suspended)', licenseNumber: 'DL-JANE-005', licenseCategory: 'Heavy', licenseExpiryDate: new Date('2028-01-01'), contactNumber: '555-0105', safetyScore: 45.0, status: 'SUSPENDED' }
    })
  ]);

  // 4. Create an active trip to populate the dashboard immediately
  await prisma.trip.create({
    data: {
      source: 'Warehouse A',
      destination: 'Distribution Center North',
      cargoWeight: 1000,
      plannedDistance: 150,
      revenue: 500,
      status: 'DISPATCHED',
      vehicleId: vehicles[2].id, // VAN-02 (ON_TRIP)
      driverId: drivers[2].id,   // Mike Ross (ON_TRIP)
    }
  });

  // 5. Create an open maintenance log
  await prisma.maintenanceLog.create({
    data: {
      serviceType: 'Engine Overhaul',
      cost: 4500,
      status: 'ACTIVE',
      vehicleId: vehicles[3].id // TRK-09 (IN_SHOP)
    }
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });