const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database cleanup...");

  // Get all table names in the public schema
  const tables = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public'
  `;

  // Filter out tables we want to keep
  const excludedTables = ['_prisma_migrations', 'roles', 'school_profile'];
  const tablesToTruncate = tables
    .map((t) => t.tablename)
    .filter((name) => !excludedTables.includes(name));

  if (tablesToTruncate.length === 0) {
    console.log("No tables to truncate.");
  } else {
    // Generate the TRUNCATE CASCADE query
    const truncateQuery = `TRUNCATE TABLE ${tablesToTruncate
      .map((name) => `"${name}"`)
      .join(', ')} CASCADE;`;

    console.log(`Truncating ${tablesToTruncate.length} tables...`);
    await prisma.$executeRawUnsafe(truncateQuery);
    console.log("Truncate complete.");
  }

  // Find or create Super Admin role
  console.log("Configuring Super Admin role...");
  let superAdminRole = await prisma.role.findUnique({
    where: { name: 'Super Admin' }
  });

  if (!superAdminRole) {
    console.log("Super Admin role not found. Creating it...");
    
    // Check for school profile first
    let schoolProfile = await prisma.schoolProfile.findFirst();
    if (!schoolProfile) {
      schoolProfile = await prisma.schoolProfile.create({
        data: { name: 'Default School Profile' }
      });
    }

    superAdminRole = await prisma.role.create({
      data: {
        name: 'Super Admin',
        description: 'System Administrator',
        permissions: ['*'],
        schoolProfileId: schoolProfile.id
      }
    });
  }

  // Create superadmin staff
  console.log("Creating superadmin user...");
  const passwordHash = await bcrypt.hash("12345678", 10);
  
  await prisma.staff.create({
    data: {
      email: 'superadmin@gmail.com',
      fullName: 'Super Administrator',
      passwordHash: passwordHash,
      roleId: superAdminRole.id
    }
  });

  console.log("Superadmin user created successfully: superadmin@gmail.com / 12345678");
  console.log("Database cleanup and initialization complete!");
}

main()
  .catch((e) => {
    console.error("Error during execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
