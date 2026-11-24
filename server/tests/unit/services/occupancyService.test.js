import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockDb = {
  sequelize: {
    query: mockQuery,
    QueryTypes: { SELECT: 'SELECT' }
  }
};

jest.unstable_mockModule('../../../app/models/index.js', () => ({
  default: mockDb,
  sequelize: mockDb.sequelize
}));

const occupancyService = await import('../../../app/services/occupancyService.js');

describe('occupancyService', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('formats normal active room occupancy with display pct capped at 100', async () => {
    mockQuery.mockResolvedValue([
      {
        room_id: 'ROM-1',
        room_name: 'Room 101',
        location: 'Lt 1',
        building: 'Gedung A',
        floor: '1',
        is_simulated: false,
        capacity: 40,
        room_status: 'ACTIVE',
        occ_id: 'OCC-1',
        confirmed_status: 'Padat',
        candidate_status: 'Padat',
        candidate_count: 2,
        person_count: 45,
        available_seats: 0,
        occupancy_pct_raw: 112.5,
        recommendations: JSON.stringify([{ room_id: 'ROM-2', room_name: 'Room 102' }]),
        is_stale: false,
        age_seconds: 12,
        updated_at: new Date()
      }
    ]);

    const result = await occupancyService.getAllRoomOccupancy();

    expect(result).toHaveLength(1);
    const room = result[0];
    expect(room.room_id).toBe('ROM-1');
    expect(room.confirmed_status).toBe('Padat');
    expect(room.person_count).toBe(45);
    expect(room.available_seats).toBe(0);
    expect(room.occupancy_pct_raw).toBe(112.5);
    // Display percentage must be capped at 100
    expect(room.occupancy_pct_display).toBe(100);
    expect(room.is_stale).toBe(false);
    expect(room.recommendations).toHaveLength(1);
    expect(room.recommendations[0].room_id).toBe('ROM-2');
  });

  it('formats occupancy percentage with Math.floor(x * 10) / 10 (e.g. 74.6% stays 74.6 and is not rounded up to 75)', async () => {
    mockQuery.mockResolvedValue([
      {
        room_id: 'ROM-SEDANG',
        room_name: 'Room Sedang',
        location: 'Lt 2',
        building: 'Gedung B',
        floor: '2',
        is_simulated: false,
        capacity: 100,
        room_status: 'ACTIVE',
        occ_id: 'OCC-SEDANG',
        confirmed_status: 'Sedang',
        candidate_status: 'Sedang',
        candidate_count: 2,
        person_count: 74,
        available_seats: 26,
        occupancy_pct_raw: 74.68,
        recommendations: '[]',
        is_stale: false,
        age_seconds: 5,
        updated_at: new Date()
      }
    ]);

    const result = await occupancyService.getAllRoomOccupancy();
    expect(result).toHaveLength(1);
    const room = result[0];
    expect(room.confirmed_status).toBe('Sedang');
    expect(room.occupancy_pct_raw).toBe(74.68);
    // 74.68 floored to 1 decimal place is 74.6 (NOT 75)
    expect(room.occupancy_pct_display).toBe(74.6);
  });

  it('handles stale room: sets Tidak tersedia, nullifies person_count and available_seats, clears recommendations', async () => {
    mockQuery.mockResolvedValue([
      {
        room_id: 'ROM-2',
        room_name: 'Room 102',
        location: 'Lt 1',
        building: 'Gedung A',
        floor: '1',
        is_simulated: false,
        capacity: 30,
        room_status: 'ACTIVE',
        occ_id: 'OCC-2',
        confirmed_status: 'Tidak tersedia',
        candidate_status: 'Sedang',
        candidate_count: 1,
        person_count: null,
        available_seats: null,
        occupancy_pct_raw: null,
        recommendations: '[]',
        is_stale: true,
        age_seconds: 150,
        updated_at: new Date(Date.now() - 150000)
      }
    ]);

    const room = await occupancyService.getRoomOccupancyById('ROM-2');

    expect(room).toBeDefined();
    expect(room.confirmed_status).toBe('Tidak tersedia');
    expect(room.is_stale).toBe(true);
    expect(room.person_count).toBeNull();
    expect(room.available_seats).toBeNull();
    expect(room.occupancy_pct_display).toBeNull();
    expect(room.recommendations).toEqual([]);
  });

  it('handles unconfigured capacity room: sets Kapasitas belum dikonfigurasi and null values', async () => {
    mockQuery.mockResolvedValue([
      {
        room_id: 'ROM-3',
        room_name: 'Room 103 (No Capacity)',
        location: 'Lt 1',
        building: 'Gedung A',
        floor: '1',
        is_simulated: false,
        capacity: null,
        room_status: 'ACTIVE',
        occ_id: 'OCC-3',
        confirmed_status: 'Kapasitas belum dikonfigurasi',
        candidate_status: null,
        candidate_count: 0,
        person_count: null,
        available_seats: null,
        occupancy_pct_raw: null,
        recommendations: '[]',
        is_stale: false,
        age_seconds: 10,
        updated_at: new Date()
      }
    ]);

    const room = await occupancyService.getRoomOccupancyById('ROM-3');

    expect(room).toBeDefined();
    expect(room.confirmed_status).toBe('Kapasitas belum dikonfigurasi');
    expect(room.person_count).toBeNull();
    expect(room.available_seats).toBeNull();
    expect(room.occupancy_pct_display).toBeNull();
    expect(room.recommendations).toEqual([]);
  });

  it('returns null when room is not found', async () => {
    mockQuery.mockResolvedValue([]);
    const room = await occupancyService.getRoomOccupancyById('ROM-NONEXISTENT');
    expect(room).toBeNull();
  });
});
