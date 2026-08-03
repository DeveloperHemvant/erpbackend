const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const route = await prisma.transportRoute.findFirst();
    const vehicle = await prisma.transportVehicle.findFirst();
    
    console.log("Route:", route?.id);
    console.log("Vehicle:", vehicle?.id);

    const trip = await prisma.transportTrip.create({
      data: {
        routeId: route.id,
        vehicleId: vehicle.id,
        tripType: "Morning",
        status: "In Progress",
        date: "2026-07-31"
      }
    });
    console.log("Trip created:", trip);
  } catch (err) {
    console.log("Prisma Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
