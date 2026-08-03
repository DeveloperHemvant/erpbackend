import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding extra roles...');

  const roles = [
    { name: 'Principal', desc: 'School Head', perms: ['*'] },
    { name: 'Vice Principal', desc: 'Deputy Head', perms: ['read', 'write'] },
    { name: 'Academic Coordinator', desc: 'Academic Head', perms: ['read', 'write'] },
    { name: 'Head of Department (HOD)', desc: 'Department Head', perms: ['read', 'write'] },
    { name: 'Operations Manager', desc: 'Operations Head', perms: ['read', 'write'] },
    { name: 'Accountant', desc: 'Finance', perms: ['read', 'write'] },
    { name: 'Librarian', desc: 'Library Manager', perms: ['read', 'write'] },
    { name: 'Transport Manager', desc: 'Transport Head', perms: ['read', 'write'] },
    { name: 'Driver', desc: 'Vehicle Driver', perms: ['read'] },
    { name: 'Conductor', desc: 'Vehicle Conductor', perms: ['read'] },
    { name: 'Hostel Warden', desc: 'Hostel Head', perms: ['read', 'write'] },
    { name: 'IT Admin', desc: 'Tech Support', perms: ['*'] },
    { name: 'Clerk', desc: 'Office Staff', perms: ['read'] },
  ];

  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: {
        name: r.name,
        description: r.desc,
        permissions: r.perms
      }
    });
    
    // Create one mock staff for each role
    const email = `${r.name.toLowerCase().replace(/[^a-z]/g, '')}@school.com`;
    await prisma.staff.upsert({
      where: { email },
      update: {},
      create: {
        fullName: `Mock ${r.name}`,
        email: email,
        passwordHash: await bcrypt.hash('Staff@123', 10),
        roleId: role.id,
        status: 'Active',
      }
    });
  }

  console.log('Extra roles and staff seeded.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
