import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import { pgService } from '../src/modules/pg/pg.service.js';
import { pgQuerySchema } from '../src/modules/pg/pg.validation.js';

describe('Public PG Listing & Search System Tests', () => {
  it('validates and parses query parameters correctly', () => {
    const valid = pgQuerySchema.parse({
      category: 'Boys,Girls',
      sort: 'price-asc',
      sharing: 'Double',
      minRent: '8000',
      maxRent: '15000',
      limit: '10',
      page: '1',
    });

    assert.deepEqual(valid.category, ['Boys', 'Girls']);
    assert.equal(valid.sort, 'price-asc');
    assert.equal(valid.sharing, 'Double');
    assert.equal(valid.minRent, 8000);
    assert.equal(valid.maxRent, 15000);
    assert.equal(valid.limit, 10);
    assert.equal(valid.page, 1);
  });

  it('rejects invalid query parameters with Zod validation error', () => {
    assert.throws(
      () => {
        pgQuerySchema.parse({ sort: 'invalid-sort-order' });
      },
      (err: any) => err.name === 'ZodError'
    );

    assert.throws(
      () => {
        pgQuerySchema.parse({ sharing: 'Penthouse' });
      },
      (err: any) => err.name === 'ZodError'
    );

    assert.throws(
      () => {
        pgQuerySchema.parse({ limit: 100 }); // Exceeds max limit 50
      },
      (err: any) => err.name === 'ZodError'
    );
  });

  it('GET /api/pgs returns only ACTIVE properties and excludes PENDING and PAUSED', async () => {
    const result = await pgService.getPublicPGs({
      sort: 'default',
      sharing: 'Any',
      page: 1,
      limit: 50,
    });

    assert.ok(result.data.length >= 4, `Expected at least 4 active properties, got ${result.data.length}`);

    // Verify all returned properties are active
    const slugs = result.data.map((p) => p.slug);
    assert.ok(slugs.includes('shree-shyam-boys-pg'));
    assert.ok(slugs.includes('ashiana-pg'));
    assert.ok(slugs.includes('hive-coliving'));
    assert.ok(slugs.includes('royal-boys-residence'));

    // CRITICAL ACCEPTANCE CHECK: A PENDING or PAUSED property must never appear in public results
    assert.equal(slugs.includes('pending-approval-pg'), false, 'PENDING property must not appear publicly');
    assert.equal(slugs.includes('paused-property-pg'), false, 'PAUSED property must not appear publicly');
  });

  it('filters properties accurately by Category', async () => {
    const boysResult = await pgService.getPublicPGs({
      category: ['Boys'],
      sort: 'default',
      sharing: 'Any',
      page: 1,
      limit: 20,
    });

    assert.ok(boysResult.data.length >= 2);
    boysResult.data.forEach((pg) => {
      assert.equal(pg.category, 'Boys');
    });

    const girlsResult = await pgService.getPublicPGs({
      category: ['Girls'],
      sort: 'default',
      sharing: 'Any',
      page: 1,
      limit: 20,
    });

    assert.ok(girlsResult.data.length >= 1);
    girlsResult.data.forEach((pg) => {
      assert.equal(pg.category, 'Girls');
    });
  });

  it('sorts properties by price-asc and price-desc', async () => {
    const ascResult = await pgService.getPublicPGs({
      sort: 'price-asc',
      sharing: 'Any',
      page: 1,
      limit: 20,
    });

    for (let i = 0; i < ascResult.data.length - 1; i++) {
      assert.ok(
        ascResult.data[i].rent <= ascResult.data[i + 1].rent,
        `Expected ${ascResult.data[i].rent} <= ${ascResult.data[i + 1].rent}`
      );
    }

    const descResult = await pgService.getPublicPGs({
      sort: 'price-desc',
      sharing: 'Any',
      page: 1,
      limit: 20,
    });

    for (let i = 0; i < descResult.data.length - 1; i++) {
      assert.ok(
        descResult.data[i].rent >= descResult.data[i + 1].rent,
        `Expected ${descResult.data[i].rent} >= ${descResult.data[i + 1].rent}`
      );
    }
  });

  it('filters properties by sharing option', async () => {
    const singleResult = await pgService.getPublicPGs({
      sharing: 'Single',
      sort: 'default',
      page: 1,
      limit: 20,
    });

    assert.ok(singleResult.data.length > 0);
    singleResult.data.forEach((pg) => {
      assert.ok(pg.sharingOptions.includes('Single'));
    });
  });

  it('filters properties by facility', async () => {
    const acResult = await pgService.getPublicPGs({
      facilities: ['ac'],
      sharing: 'Any',
      sort: 'default',
      page: 1,
      limit: 20,
    });

    assert.ok(acResult.data.length > 0);
    acResult.data.forEach((pg) => {
      assert.equal(pg.facilities.ac, true);
    });
  });

  it('filters properties by locality / search keyword', async () => {
    const searchResult = await pgService.getPublicPGs({
      locality: 'Malviya',
      sharing: 'Any',
      sort: 'default',
      page: 1,
      limit: 20,
    });

    assert.ok(searchResult.data.length >= 1);
    assert.equal(searchResult.data[0].slug, 'shree-shyam-boys-pg');
  });

  it('GET /api/pgs/:slug returns full details for active property', async () => {
    const details = await pgService.getPublicPGBySlug('shree-shyam-boys-pg');

    assert.equal(details.name, 'Shree Shyam Boys PG');
    assert.equal(details.category, 'Boys');
    assert.equal(details.locality, 'Malviya Nagar');
    assert.ok(details.gallery.length > 0);
    assert.ok(details.roomTypes.length > 0);
    assert.ok(details.rules.length > 0);
    assert.equal(details.facilities.ac, true);
    assert.equal(details.facilities.wifi, true);
    assert.equal(details.facilities.food, true);

    // Contact details returned only if provided
    assert.ok(details.ownerContact);
    assert.equal(details.ownerContact?.phone, '9876543210');
  });

  it('GET /api/pgs/:slug returns 404 for PENDING, PAUSED or non-existent property', async () => {
    await assert.rejects(
      async () => {
        await pgService.getPublicPGBySlug('pending-approval-pg');
      },
      (err: any) => err.statusCode === 404
    );

    await assert.rejects(
      async () => {
        await pgService.getPublicPGBySlug('paused-property-pg');
      },
      (err: any) => err.statusCode === 404
    );

    await assert.rejects(
      async () => {
        await pgService.getPublicPGBySlug('does-not-exist-at-all');
      },
      (err: any) => err.statusCode === 404
    );
  });

  it('GET /api/localities returns distinct localities from active properties', async () => {
    const localities = await pgService.getPublicLocalities();
    assert.ok(Array.isArray(localities));
    assert.ok(localities.length >= 3);

    const localityNames = localities.map((l) => l.locality);
    assert.ok(localityNames.includes('Malviya Nagar'));
    assert.ok(localityNames.includes('Vaishali Nagar'));
    assert.ok(localityNames.includes('Mansarovar'));

    // PENDING property locality (C-Scheme) must not appear if no active property exists there
    assert.equal(localityNames.includes('C-Scheme'), false);
    // PAUSED property locality (Gopalpura) must not appear
    assert.equal(localityNames.includes('Gopalpura'), false);
  });
});
