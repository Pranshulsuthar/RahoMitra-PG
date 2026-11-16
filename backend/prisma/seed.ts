import {
  PrismaClient,
  Role,
  UserStatus,
  PlanStatus,
  BillingCycle,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'node:path';

// Load .env explicitly for seed execution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required to run seed.');
  }

  const cleanEmail = adminEmail.trim().toLowerCase();
  console.log(`🌱 Seeding initial database setup for: ${cleanEmail}...`);

  // 1. Create or ensure initial ADMIN user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!existingAdmin) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        fullName: 'RahoMitra Super Admin',
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`✅ Super Admin created successfully.`);
  } else {
    console.log(`ℹ️ Admin user already exists. Skipping admin creation.`);
  }

  // 2. Seed Default Plans if not already present
  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    console.log('🌱 Seeding initial subscription plans...');
    await prisma.plan.createMany({
      data: [
        {
          id: 'starter',
          name: 'STARTER',
          tagline: 'Manage up to 1 PG property with everything you need to get started.',
          features: [
            'Manage up to 1 PG property',
            'Basic room and bed management',
            'Student management',
            'Monthly billing management',
            'Basic reports',
            'Standard support',
          ],
          priceMonthly: 299,
          priceYearly: 2990,
          status: PlanStatus.ENABLED,
          propertyLimit: 1,
          billing: BillingCycle.MONTHLY,
          featureToggles: [
            { key: 'pg_limit_1', label: 'Manage up to 1 PG property', enabled: true },
            { key: 'rooms', label: 'Basic room and bed management', enabled: true },
            { key: 'students', label: 'Student management', enabled: true },
            { key: 'billing', label: 'Monthly billing management', enabled: true },
            { key: 'reports_basic', label: 'Basic reports', enabled: true },
            { key: 'support_standard', label: 'Standard support', enabled: true },
            { key: 'staff', label: 'Staff management', enabled: false },
            { key: 'analytics', label: 'Advanced analytics', enabled: false },
            { key: 'featured_eligibility', label: 'Featured listing eligibility', enabled: false },
          ],
          isCustom: false,
        },
        {
          id: 'professional',
          name: 'PROFESSIONAL',
          tagline: 'All Starter features plus advanced billing, staff and occupancy reports.',
          features: [
            'Manage up to 3 PG properties',
            'All Starter features',
            'Advanced billing management',
            'Staff management',
            'Announcements and complaints',
            'Occupancy reports',
            'Priority support',
          ],
          priceMonthly: 599,
          priceYearly: 5990,
          status: PlanStatus.ENABLED,
          propertyLimit: 3,
          billing: BillingCycle.MONTHLY,
          featureToggles: [
            { key: 'pg_limit_3', label: 'Manage up to 3 PG properties', enabled: true },
            { key: 'rooms', label: 'Basic room and bed management', enabled: true },
            { key: 'students', label: 'Student management', enabled: true },
            { key: 'billing', label: 'Monthly billing management', enabled: true },
            { key: 'reports_basic', label: 'Basic reports', enabled: true },
            { key: 'support_priority', label: 'Priority support', enabled: true },
            { key: 'billing_advanced', label: 'Advanced billing management', enabled: true },
            { key: 'staff', label: 'Staff management', enabled: true },
            { key: 'comms', label: 'Announcements and complaints', enabled: true },
            { key: 'occupancy', label: 'Occupancy reports', enabled: true },
            { key: 'analytics', label: 'Advanced analytics', enabled: false },
            { key: 'featured_eligibility', label: 'Featured listing eligibility', enabled: false },
          ],
          isCustom: false,
        },
        {
          id: 'premium',
          name: 'PREMIUM',
          tagline: 'All Professional features plus advanced analytics and featured listing eligibility.',
          features: [
            'Manage up to 10 PG properties',
            'All Professional features',
            'Advanced analytics',
            'Detailed revenue reports',
            'Featured listing eligibility',
            'Advanced platform tools',
            'Premium support',
          ],
          priceMonthly: 999,
          priceYearly: 9990,
          status: PlanStatus.ENABLED,
          propertyLimit: 10,
          billing: BillingCycle.MONTHLY,
          featureToggles: [
            { key: 'pg_limit_10', label: 'Manage up to 10 PG properties', enabled: true },
            { key: 'rooms', label: 'Basic room and bed management', enabled: true },
            { key: 'students', label: 'Student management', enabled: true },
            { key: 'billing', label: 'Monthly billing management', enabled: true },
            { key: 'reports_basic', label: 'Basic reports', enabled: true },
            { key: 'support_priority', label: 'Priority support', enabled: true },
            { key: 'billing_advanced', label: 'Advanced billing management', enabled: true },
            { key: 'staff', label: 'Staff management', enabled: true },
            { key: 'comms', label: 'Announcements and complaints', enabled: true },
            { key: 'occupancy', label: 'Occupancy reports', enabled: true },
            { key: 'analytics', label: 'Advanced analytics', enabled: true },
            { key: 'featured_eligibility', label: 'Featured listing eligibility', enabled: true },
          ],
          isCustom: false,
        },
      ],
    });
    console.log('✅ Initial plans seeded.');
  }

  // 3. Seed Platform Settings if not already present
  const existingSettings = await prisma.platformSetting.findUnique({
    where: { key: 'general' },
  });

  if (!existingSettings) {
    console.log('🌱 Seeding initial platform settings...');
    await prisma.platformSetting.create({
      data: {
        key: 'general',
        value: {
          platformName: 'RahoMitra',
          hindiName: 'रहोमित्र',
          tagline: 'Your Trusted PG Companion',
          description: 'A dedicated PG accommodation and tenant management platform for India.',
          supportEmail: 'support@rahomitra.com',
          supportPhone: '+91 98765 43210',
          currency: 'INR',
          country: 'India',
          timezone: 'Asia/Kolkata',
          trialDurationDays: 14,
          gracePeriodDays: 7,
          featuredPrice: 299,
          premiumFeaturedPrice: 499,
          adPriceBase: 999,
          maintenanceMode: false,
        },
      },
    });
    console.log('✅ Platform settings seeded.');
  }

  console.log('🎉 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
