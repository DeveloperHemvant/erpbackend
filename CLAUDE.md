# Backend Rules

Framework:
NestJS + Prisma + PostgreSQL


## Architecture

Follow:

Controller
    |
Service
    |
Repository
    |
Prisma


Avoid:

Service
    |
PrismaService


## Module Structure

Example:

student/

├── controllers/
├── services/
├── repositories/
├── dto/
├── interfaces/
└── module.ts


## Prisma Rules

- PrismaService should be centralized.
- Feature modules should access database through repositories.
- Do not put business logic inside repositories.


## Domain Separation

Avoid huge services.

Split:

ErpCoreService

into:

TenantService
RoleService
PermissionService
AuditService
ConfigurationService


## API Rules

- Maintain existing response structure.
- Maintain validation.
- Maintain authorization checks.