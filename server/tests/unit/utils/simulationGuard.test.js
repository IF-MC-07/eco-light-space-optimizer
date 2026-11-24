import { jest } from '@jest/globals';
import { isSimulatedRoom, clearGuardCache, getGuardTtlMs } from '../../../app/utils/simulationGuard.js';
import db from '../../../app/models/index.js';

describe('simulationGuard.js', () => {
  beforeEach(() => {
    clearGuardCache();
    jest.clearAllMocks();
  });

  afterAll(() => {
    clearGuardCache();
  });

  it('returns false for null, undefined, or empty roomId', async () => {
    expect(await isSimulatedRoom(null)).toBe(false);
    expect(await isSimulatedRoom(undefined)).toBe(false);
    expect(await isSimulatedRoom('')).toBe(false);
  });

  it('returns true when room is marked as simulated', async () => {
    const querySpy = jest.spyOn(db.sequelize, 'query').mockResolvedValueOnce([{ is_simulated: true }]);
    
    const result = await isSimulatedRoom('ROM-s01');
    expect(result).toBe(true);
    expect(querySpy).toHaveBeenCalledTimes(1);
    expect(querySpy).toHaveBeenCalledWith(
      expect.stringContaining('SELECT is_simulated FROM rooms'),
      expect.objectContaining({
        replacements: { roomId: 'ROM-s01' },
      })
    );
  });

  it('returns false when room is physical (is_simulated = false)', async () => {
    const querySpy = jest.spyOn(db.sequelize, 'query').mockResolvedValueOnce([{ is_simulated: false }]);
    
    const result = await isSimulatedRoom('ROM-001');
    expect(result).toBe(false);
    expect(querySpy).toHaveBeenCalledTimes(1);
  });

  it('returns false when room is not found in database', async () => {
    const querySpy = jest.spyOn(db.sequelize, 'query').mockResolvedValueOnce([]);
    
    const result = await isSimulatedRoom('ROM-unknown');
    expect(result).toBe(false);
    expect(querySpy).toHaveBeenCalledTimes(1);
  });

  it('returns false when database query throws an error', async () => {
    const querySpy = jest.spyOn(db.sequelize, 'query').mockRejectedValueOnce(new Error('DB Connection Timeout'));
    
    const result = await isSimulatedRoom('ROM-err');
    expect(result).toBe(false);
    expect(querySpy).toHaveBeenCalledTimes(1);
  });

  it('caches the result within TTL and does not query database again', async () => {
    const querySpy = jest.spyOn(db.sequelize, 'query').mockResolvedValueOnce([{ is_simulated: true }]);
    
    const firstCall = await isSimulatedRoom('ROM-cached');
    expect(firstCall).toBe(true);
    expect(querySpy).toHaveBeenCalledTimes(1);

    const secondCall = await isSimulatedRoom('ROM-cached');
    expect(secondCall).toBe(true);
    expect(querySpy).toHaveBeenCalledTimes(1); // Cached! No additional DB query
  });
});

