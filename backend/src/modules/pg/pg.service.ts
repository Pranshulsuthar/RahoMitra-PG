import { PGCategory, PropertyStatus, RoomType as PrismaRoomType, FoodOption } from '@prisma/client';
import { prisma } from '../../db/client.js';
import { AppError } from '../../utils/errors.js';
import { PGQueryInput } from './pg.validation.js';

export interface PGFacilities {
  ac: boolean;
  wifi: boolean;
  food: boolean;
  laundry: boolean;
  housekeeping: boolean;
  powerBackup: boolean;
  cctv: boolean;
  parking: boolean;
  studyTable: boolean;
  attachedBathroom: boolean;
}

export type SharingOption = 'Single' | 'Double' | 'Triple';

export interface RoomTypeItem {
  label: string;
  sharing: SharingOption;
  rent: number;
}

export interface OwnerContact {
  phone?: string;
  whatsapp?: string;
  displayName?: string;
}

export interface FormattedPG {
  id: string;
  slug: string;
  name: string;
  category: 'Boys' | 'Girls' | 'Co-living';
  locality: string;
  city: string;
  rent: number;
  securityDeposit: number;
  description: string;
  coverImage: string;
  gallery: string[];
  facilities: PGFacilities;
  sharingOptions: SharingOption[];
  roomTypes: RoomTypeItem[];
  foodAvailability: 'Included in rent' | 'Available at extra cost' | 'Not available';
  rules: string[];
  availabilityNote: string;
  isDemo?: boolean;
  ownerContact: OwnerContact | null;
}

const CATEGORY_MAP: Record<PGCategory, 'Boys' | 'Girls' | 'Co-living'> = {
  BOYS: 'Boys',
  GIRLS: 'Girls',
  CO_LIVING: 'Co-living',
};

const REVERSE_CATEGORY_MAP: Record<string, PGCategory> = {
  boys: PGCategory.BOYS,
  girls: PGCategory.GIRLS,
  'co-living': PGCategory.CO_LIVING,
  coliving: PGCategory.CO_LIVING,
};

const ROOM_SHARING_MAP: Record<PrismaRoomType, SharingOption | null> = {
  SINGLE: 'Single',
  DOUBLE: 'Double',
  TRIPLE: 'Triple',
  QUAD: null,
  CUSTOM: null,
};

function formatFacilities(facilityList: string[], foodOption: FoodOption): PGFacilities {
  const set = new Set(facilityList.map((f) => f.toLowerCase().replace(/[-_ ]/g, '')));
  return {
    ac: set.has('ac'),
    wifi: set.has('wifi'),
    food: set.has('food') || foodOption !== FoodOption.NOT_AVAILABLE,
    laundry: set.has('laundry'),
    housekeeping: set.has('housekeeping'),
    powerBackup: set.has('powerbackup'),
    cctv: set.has('cctv'),
    parking: set.has('parking'),
    studyTable: set.has('studytable'),
    attachedBathroom: set.has('attachedbathroom'),
  };
}

function formatFoodAvailability(food: FoodOption): 'Included in rent' | 'Available at extra cost' | 'Not available' {
  switch (food) {
    case FoodOption.INCLUDED:
      return 'Included in rent';
    case FoodOption.PAID:
      return 'Available at extra cost';
    case FoodOption.NOT_AVAILABLE:
    default:
      return 'Not available';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPropertyToPG(property: any): FormattedPG {
  const category = CATEGORY_MAP[property.type as PGCategory] || 'Co-living';
  const facilities = formatFacilities(property.facilities || [], property.food as FoodOption);
  const foodAvailability = formatFoodAvailability(property.food as FoodOption);

  // Parse rooms and sharing options
  const sharingSet = new Set<SharingOption>();
  const roomTypesMap = new Map<string, RoomTypeItem>();
  let minRent = Infinity;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (property.rooms || []).forEach((room: any) => {
    const sharing = ROOM_SHARING_MAP[room.type as PrismaRoomType] || 'Single';
    sharingSet.add(sharing);

    if (typeof room.rent === 'number' && room.rent > 0) {
      if (room.rent < minRent) {
        minRent = room.rent;
      }
      const label = `${sharing} Sharing`;
      if (!roomTypesMap.has(label) || room.rent < roomTypesMap.get(label)!.rent) {
        roomTypesMap.set(label, {
          label,
          sharing,
          rent: room.rent,
        });
      }
    }
  });

  const sharingOptions = Array.from(sharingSet);
  if (sharingOptions.length === 0) {
    sharingOptions.push('Single');
  }

  const roomTypes = Array.from(roomTypesMap.values());
  const effectiveRent = minRent !== Infinity ? minRent : 0;

  // Owner contact details - strictly returned only if provided
  let ownerContact: OwnerContact | null = null;
  const contactNumber = property.contactPhone || property.owner?.mobile;
  if (contactNumber && contactNumber.trim().length >= 10) {
    ownerContact = {
      phone: contactNumber.trim(),
      whatsapp: contactNumber.trim(),
      displayName: property.owner?.fullName || property.name,
    };
  }

  // Cover image with fallback
  const coverImage = property.coverImage || (property.gallery?.[0] ?? '/image-placeholder.svg');

  return {
    id: property.id,
    slug: property.slug,
    name: property.name,
    category,
    locality: property.locality,
    city: property.city,
    rent: effectiveRent,
    securityDeposit: property.securityDeposit || 0,
    description: property.description || '',
    coverImage,
    gallery: property.gallery?.length ? property.gallery : [coverImage],
    facilities,
    sharingOptions,
    roomTypes,
    foodAvailability,
    rules: property.rules || [],
    availabilityNote: 'Live verified availability status.',
    isDemo: false,
    ownerContact,
  };
}

export class PGService {
  /**
   * List approved and active PGs with multi-facet filters, sorting, and pagination
   */
  async getPublicPGs(query: PGQueryInput) {
    const { category, city, locality, sort, facilities, sharing, food, minRent, maxRent, page, limit } = query;

    // Base filter: STRICTLY ACTIVE properties only
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      status: PropertyStatus.ACTIVE,
    };

    // Category filter
    if (category && category.length > 0) {
      const dbCategories = category
        .map((c) => REVERSE_CATEGORY_MAP[c.toLowerCase()])
        .filter((c): c is PGCategory => Boolean(c));
      if (dbCategories.length > 0) {
        where.type = { in: dbCategories };
      }
    }

    // City filter
    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }

    // Locality / Search text filter
    if (locality) {
      const q = locality.trim();
      where.OR = [
        { locality: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Facilities filter (stored as string array in Prisma)
    if (facilities && facilities.length > 0) {
      where.facilities = {
        hasSome: facilities,
      };
    }

    // Fetch matching properties including rooms and owner
    const properties = await prisma.property.findMany({
      where,
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
        owner: {
          select: {
            fullName: true,
            mobile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform and apply in-memory facet filters (sharing, price range, precise facilities, food)
    let formattedList = properties.map(transformPropertyToPG);

    // 1. Sharing filter
    if (sharing && sharing !== 'Any') {
      formattedList = formattedList.filter((pg) => pg.sharingOptions.includes(sharing));
    }

    // 2. Strict facilities check (must satisfy all requested facilities)
    if (facilities && facilities.length > 0) {
      formattedList = formattedList.filter((pg) => {
        return facilities.every((facKey) => {
          const key = facKey.toLowerCase().replace(/[-_ ]/g, '') as keyof PGFacilities;
          return Boolean(pg.facilities[key]);
        });
      });
    }

    // 3. Food availability filter
    if (food) {
      formattedList = formattedList.filter((pg) => {
        if (food === 'Included in rent') return pg.foodAvailability === 'Included in rent';
        if (food === 'Available at extra cost') return pg.foodAvailability === 'Available at extra cost';
        if (food === 'Not available') return pg.foodAvailability === 'Not available';
        return true;
      });
    }

    // 4. Rent price range filters
    if (minRent !== undefined) {
      formattedList = formattedList.filter((pg) => pg.rent >= minRent);
    }
    if (maxRent !== undefined) {
      formattedList = formattedList.filter((pg) => pg.rent <= maxRent);
    }

    // 5. Sorting
    if (sort === 'price-asc') {
      formattedList.sort((a, b) => a.rent - b.rent);
    } else if (sort === 'price-desc') {
      formattedList.sort((a, b) => b.rent - a.rent);
    }

    const total = formattedList.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedList = formattedList.slice(startIndex, startIndex + limit);

    return {
      data: paginatedList,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get single PG details by slug (must be active)
   */
  async getPublicPGBySlug(slug: string) {
    const cleanSlug = slug.trim().toLowerCase();
    const property = await prisma.property.findUnique({
      where: { slug: cleanSlug },
      include: {
        rooms: {
          include: {
            beds: true,
          },
        },
        owner: {
          select: {
            fullName: true,
            mobile: true,
          },
        },
      },
    });

    if (!property || property.status !== PropertyStatus.ACTIVE) {
      throw AppError.notFound('Property not found or is no longer active');
    }

    return transformPropertyToPG(property);
  }

  /**
   * Get distinct localities and cities for search autocomplete
   */
  async getPublicLocalities() {
    const activeProperties = await prisma.property.findMany({
      where: { status: PropertyStatus.ACTIVE },
      select: { city: true, locality: true },
      distinct: ['city', 'locality'],
      orderBy: { locality: 'asc' },
    });

    return activeProperties.map((p) => ({
      city: p.city,
      locality: p.locality,
    }));
  }
}

export const pgService = new PGService();
