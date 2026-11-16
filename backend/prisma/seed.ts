import {
  PrismaClient,
  Role,
  UserStatus,
  PlanStatus,
  BillingCycle,
  PropertyStatus,
  PGCategory,
  RoomType,
  FoodOption,
  BedStatus,
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

  // 4. Seed Verified Demo Owner and Properties
  console.log('🌱 Seeding demo owner and properties...');
  let demoOwner = await prisma.user.findUnique({
    where: { email: 'owner@rahomitra.com' },
  });

  if (!demoOwner) {
    const ownerPassHash = await bcrypt.hash('Owner@RahoMitra2026!', 12);
    demoOwner = await prisma.user.create({
      data: {
        email: 'owner@rahomitra.com',
        passwordHash: ownerPassHash,
        role: Role.OWNER,
        status: UserStatus.ACTIVE,
        fullName: 'Rajesh Sharma',
        mobile: '9876543210',
        emailVerifiedAt: new Date(),
      },
    });
    console.log('✅ Demo Owner created: owner@rahomitra.com');
  }

  const propertyData = [
    {
      slug: 'shree-shyam-boys-pg',
      name: 'Shree Shyam Boys PG',
      type: PGCategory.BOYS,
      locality: 'Malviya Nagar',
      city: 'Jaipur',
      address: 'Plot 42, Sector 3, Malviya Nagar, Jaipur',
      description: 'A quiet, study-friendly boys PG with furnished rooms, shared kitchen access and daily housekeeping.',
      securityDeposit: 10000,
      contactPhone: '9876543210',
      contactEmail: 'shree-shyam@rahomitra.com',
      facilities: ['ac', 'wifi', 'food', 'laundry', 'housekeeping', 'powerbackup', 'cctv', 'studytable'],
      food: FoodOption.INCLUDED,
      rules: [
        'Visitors are allowed up to 8:00 PM.',
        'Smoking and alcohol are strictly prohibited.',
        'Monthly rent is payable by 5th of every month.',
        'Keep noise low after 10:00 PM.',
      ],
      coverImage: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
      ],
      status: PropertyStatus.ACTIVE,
      rooms: [
        { number: '101', floor: 1, type: RoomType.DOUBLE, rent: 9500 },
        { number: '102', floor: 1, type: RoomType.TRIPLE, rent: 7800 },
      ],
    },
    {
      slug: 'ashiana-pg',
      name: 'Ashiana PG for Girls',
      type: PGCategory.GIRLS,
      locality: 'Vaishali Nagar',
      city: 'Jaipur',
      address: 'A-12, Gandhi Path, Vaishali Nagar, Jaipur',
      description: 'Safe, premium girls accommodation with CCTV security, nutritious meals and biometric entry.',
      securityDeposit: 12000,
      contactPhone: '9876543210',
      contactEmail: 'ashiana@rahomitra.com',
      facilities: ['ac', 'wifi', 'food', 'laundry', 'housekeeping', 'powerbackup', 'cctv', 'parking', 'studytable', 'attachedbathroom'],
      food: FoodOption.INCLUDED,
      rules: [
        'Gate closes at 9:30 PM.',
        'Female visitors allowed in common area.',
        'Strictly no smoking.',
      ],
      coverImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      ],
      status: PropertyStatus.ACTIVE,
      rooms: [
        { number: '201', floor: 2, type: RoomType.SINGLE, rent: 14000 },
        { number: '202', floor: 2, type: RoomType.DOUBLE, rent: 11000 },
      ],
    },
    {
      slug: 'hive-coliving',
      name: 'The Hive Co-living',
      type: PGCategory.CO_LIVING,
      locality: 'Mansarovar',
      city: 'Jaipur',
      address: '77, Madhyam Marg, Mansarovar, Jaipur',
      description: 'Vibrant co-living community for working professionals and university students with high-speed internet and gaming lounge.',
      securityDeposit: 15000,
      contactPhone: '9876543210',
      contactEmail: 'hive@rahomitra.com',
      facilities: ['ac', 'wifi', 'food', 'laundry', 'housekeeping', 'powerbackup', 'cctv', 'parking', 'attachedbathroom'],
      food: FoodOption.PAID,
      rules: [
        'Respect quiet hours after 11:00 PM.',
        'Shared kitchen must be kept clean after cooking.',
      ],
      coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      gallery: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
      ],
      status: PropertyStatus.ACTIVE,
      rooms: [
        { number: '301', floor: 3, type: RoomType.SINGLE, rent: 16500 },
        { number: '302', floor: 3, type: RoomType.DOUBLE, rent: 12500 },
      ],
    },
    {
      slug: 'royal-boys-residence',
      name: 'Royal Boys Residence',
      type: PGCategory.BOYS,
      locality: 'Tonk Road',
      city: 'Jaipur',
      address: '15, Tonk Road, Near Glass Factory, Jaipur',
      description: 'Budget-friendly boys PG with spacious rooms, laundry facility and parking.',
      securityDeposit: 8000,
      contactPhone: '9876543210',
      contactEmail: 'royal@rahomitra.com',
      facilities: ['wifi', 'laundry', 'powerbackup', 'cctv', 'parking'],
      food: FoodOption.PAID,
      rules: [
        'Rent due on 1st of every month.',
        'Smoking inside rooms is prohibited.',
      ],
      coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      gallery: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'],
      status: PropertyStatus.ACTIVE,
      rooms: [
        { number: '101', floor: 1, type: RoomType.DOUBLE, rent: 8500 },
        { number: '102', floor: 1, type: RoomType.TRIPLE, rent: 6800 },
      ],
    },
    // Inactive properties to test acceptance check: "A PENDING or PAUSED property never appears in public results"
    {
      slug: 'pending-approval-pg',
      name: 'Under Review Residency',
      type: PGCategory.BOYS,
      locality: 'C-Scheme',
      city: 'Jaipur',
      address: '22, C-Scheme, Jaipur',
      description: 'This property is pending admin verification and must NOT be publicly visible.',
      securityDeposit: 10000,
      contactPhone: '',
      contactEmail: '',
      facilities: ['ac', 'wifi'],
      food: FoodOption.NOT_AVAILABLE,
      rules: [],
      coverImage: '',
      gallery: [],
      status: PropertyStatus.PENDING,
      rooms: [{ number: 'P1', floor: 1, type: RoomType.SINGLE, rent: 9000 }],
    },
    {
      slug: 'paused-property-pg',
      name: 'Temporarily Paused Hostel',
      type: PGCategory.GIRLS,
      locality: 'Gopalpura',
      city: 'Jaipur',
      address: '5, Gopalpura Bypass, Jaipur',
      description: 'This property is paused by the owner and must NOT be publicly visible.',
      securityDeposit: 10000,
      contactPhone: '',
      contactEmail: '',
      facilities: ['wifi'],
      food: FoodOption.NOT_AVAILABLE,
      rules: [],
      coverImage: '',
      gallery: [],
      status: PropertyStatus.PAUSED,
      rooms: [{ number: 'PA1', floor: 1, type: RoomType.SINGLE, rent: 7500 }],
    },
  ];

  for (const item of propertyData) {
    const existing = await prisma.property.findUnique({
      where: { slug: item.slug },
    });

    if (!existing) {
      const createdProp = await prisma.property.create({
        data: {
          ownerId: demoOwner.id,
          slug: item.slug,
          name: item.name,
          type: item.type,
          locality: item.locality,
          city: item.city,
          address: item.address,
          description: item.description,
          securityDeposit: item.securityDeposit,
          contactPhone: item.contactPhone,
          contactEmail: item.contactEmail,
          facilities: item.facilities,
          food: item.food,
          rules: item.rules,
          coverImage: item.coverImage,
          gallery: item.gallery,
          status: item.status,
        },
      });

      // Create rooms and beds for the property
      for (const roomItem of item.rooms) {
        const createdRoom = await prisma.room.create({
          data: {
            propertyId: createdProp.id,
            number: roomItem.number,
            floor: roomItem.floor,
            type: roomItem.type,
            rent: roomItem.rent,
          },
        });

        const bedCount = roomItem.type === RoomType.SINGLE ? 1 : roomItem.type === RoomType.DOUBLE ? 2 : 3;
        for (let b = 1; b <= bedCount; b++) {
          await prisma.bed.create({
            data: {
              roomId: createdRoom.id,
              label: `Bed ${b}`,
              status: BedStatus.AVAILABLE,
            },
          });
        }
      }
      console.log(`✅ Seeded property: ${item.name} (${item.status})`);
    }
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
