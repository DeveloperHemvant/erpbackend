const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const driverStaff = await prisma.staff.findFirst({
        where: { email: 'driver1@school.com' }
    });
    
    console.log("Driver ID:", driverStaff.id);
    
    const staffAssignment = await prisma.transportVehicleStaff.findFirst({
      where: { staffId: driverStaff.id },
      include: {
        vehicle: true
      }
    });
    
    console.log("Vehicle Assignment:", staffAssignment);
    
    if (staffAssignment && staffAssignment.vehicle) {
        const vehicle = staffAssignment.vehicle;
        const route = await prisma.transportRoute.findFirst({
            where: { vehicleId: vehicle.id }
        });
        console.log("Route for Vehicle:", route);
    }
  } catch (err) {
    console.log("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
