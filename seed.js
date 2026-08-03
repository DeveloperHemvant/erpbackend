const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const enrollments = await prisma.studentEnrollment.findMany({ take: 50 });
  if (enrollments.length === 0) return console.log('No enrollments');

  const vehicle = await prisma.transportVehicle.findFirst();
  if (!vehicle) return console.log('No vehicle');

  let route = await prisma.transportRoute.findFirst();
  if (!route) return console.log('No route found');

  await prisma.transportRoute.update({ where: { id: route.id }, data: { vehicleId: vehicle.id } });

  const stops = await prisma.transportRouteStop.findMany({ where: { routeId: route.id }, orderBy: { orderIndex: 'asc' } });
  if (stops.length === 0) return console.log('No stops');

  await prisma.transportStudentAssignment.deleteMany({ where: { routeId: route.id } });
  
  for (let i = 0; i < enrollments.length; i++) {
    await prisma.transportStudentAssignment.create({
      data: { enrollmentId: enrollments[i].id, routeId: route.id, stopId: stops[i % stops.length].id, morningPickup: true, afternoonDrop: true }
    });
  }
  console.log('Assigned ' + enrollments.length + ' students');
}
run().catch(console.error).finally(() => prisma.$disconnect());
