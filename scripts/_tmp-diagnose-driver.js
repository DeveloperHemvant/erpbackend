const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const driver = await prisma.staff.findUnique({ where: { email: 'driver.main@centralacademy.edu' } });
  console.log('Named driver:', driver?.id, driver?.fullName);

  const assignment = await prisma.transportVehicleStaff.findMany({ where: { staffId: driver.id } });
  console.log('TransportVehicleStaff rows for this driver:', assignment.length);

  const trips = await prisma.transportTrip.findMany({ where: { driverId: driver.id }, take: 3 });
  console.log('TransportTrip rows for this driver:', trips.length, trips.map(t => t.date));

  const tripDateRange = await prisma.transportTrip.aggregate({ _min: { date: true }, _max: { date: true } });
  console.log('All TransportTrip date range:', tripDateRange._min.date, 'to', tripDateRange._max.date);
  const tripCount = await prisma.transportTrip.count();
  console.log('Total TransportTrip rows:', tripCount);

  await prisma.$disconnect();
})();
