import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Transport Dynamic Seed...');

  // 1. Fetch some Staff for Drivers & Conductors
  const staffMembers = await prisma.staff.findMany({ take: 5 });
  if (staffMembers.length === 0) {
    console.log('No staff found. Please seed staff first.');
    return;
  }

  // 2. Fetch some Students
  const enrollments = await prisma.studentEnrollment.findMany({ take: 20 });
  if (enrollments.length === 0) {
    console.log('No students found. Please seed students first.');
    return;
  }

  // 3. Create dummy Vehicles
  console.log('Creating Vehicles...');
  const vehiclesData = [
    { vehicleNumber: 'TN-01-AB-1234', vehicleType: 'School Bus', seatingCapacity: 40, fuelType: 'Diesel', status: 'Active' },
    { vehicleNumber: 'TN-01-AB-5678', vehicleType: 'School Bus', seatingCapacity: 40, fuelType: 'Diesel', status: 'Active' },
    { vehicleNumber: 'TN-01-XY-9999', vehicleType: 'Mini Bus', seatingCapacity: 20, fuelType: 'CNG', status: 'Active' },
    { vehicleNumber: 'TN-02-ZZ-1010', vehicleType: 'School Bus', seatingCapacity: 50, fuelType: 'EV', status: 'Active' },
    { vehicleNumber: 'TN-02-ZZ-2020', vehicleType: 'Van', seatingCapacity: 15, fuelType: 'Petrol', status: 'Maintenance' },
  ];
  
  const vehicles: any[] = [];
  for (const v of vehiclesData) {
    const created = await prisma.transportVehicle.upsert({
      where: { vehicleNumber: v.vehicleNumber },
      update: {},
      create: v
    });
    vehicles.push(created);
  }

  // 4. Create dummy Routes and Stops (25 stops per route)
  console.log('Creating Routes & Stops...');
  
  // Generate 25 stops dynamically
  const generateStops = (prefix: string) => {
    return Array.from({ length: 25 }).map((_, i) => ({
      stopName: `${prefix} Stop ${i + 1}`,
      orderIndex: i + 1,
      arrivalTime: `0${7 + Math.floor(i / 10)}:${(i % 10) * 5 < 10 ? '0' : ''}${(i % 10) * 5} AM`
    }));
  };

  const routeNames = ['North City Express', 'South Valley Loop', 'East Coast Drive', 'West End Link', 'Central Hub Shuttle'];
  const routes: any[] = [];
  
  for (let i = 0; i < routeNames.length; i++) {
    const routeName = routeNames[i];
    const prefix = routeName.split(' ')[0];
    const newRoute = await prisma.transportRoute.create({
      data: {
        routeName: routeName,
        distance: 20 + i * 5,
        estimatedTime: `${60 + i * 15} Mins`,
        stops: { create: generateStops(prefix) }
      },
      include: { stops: true }
    });
    routes.push(newRoute);
  }
  // 5. Assign Staff to Vehicles
  console.log('Assigning Staff to Vehicles...');
  for (let i = 0; i < vehicles.length && i < staffMembers.length; i++) {
    // Assign a Driver
    await prisma.transportVehicleStaff.create({
      data: {
        vehicleId: vehicles[i].id,
        staffId: staffMembers[i].id,
        shift: 'Driver - Full Day'
      }
    });
    // Assign a Conductor if there's enough staff
    if (staffMembers[i + 1]) {
      await prisma.transportVehicleStaff.create({
        data: {
          vehicleId: vehicles[i].id,
          staffId: staffMembers[i + 1].id,
          shift: 'Conductor - Full Day'
        }
      });
    }
  }

  // 6. Assign Students to Stops
  console.log('Assigning Students to Stops...');
  let routeIndex = 0;
  let stopIndex = 0;
  for (const enrollment of enrollments) {
    const currentRoute = routes[routeIndex];
    await prisma.transportStudentAssignment.create({
      data: {
        enrollmentId: enrollment.id,
        routeId: currentRoute.id,
        stopId: currentRoute.stops[stopIndex].id,
        morningPickup: true,
        afternoonDrop: true,
        status: 'Active'
      }
    });
    
    stopIndex++;
    if (stopIndex >= currentRoute.stops.length) {
      stopIndex = 0;
      routeIndex = (routeIndex + 1) % routes.length;
    }
  }

  console.log('Transport Seed Complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
