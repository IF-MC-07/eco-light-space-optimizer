import { describe, expect, it } from '@jest/globals';
import { createRoomSchema, updateRoomSchema } from '../../../app/validations/room.validation.js';

describe('Room Joi Validation Schema', () => {
  describe('createRoomSchema', () => {
    it('accepts valid payload and strips is_simulated', () => {
      const payload = {
        room_name: 'Lab IoT',
        location: 'Gedung TI',
        capacity: 40,
        building: 'Gedung TI',
        floor: 'Lantai 2',
        status: 'ACTIVE',
        is_simulated: true, // Should be stripped!
        unknown_field: 'malicious'
      };

      const { error, value } = createRoomSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.room_name).toBe('Lab IoT');
      expect(value.capacity).toBe(40);
      expect(value.building).toBe('Gedung TI');
      expect(value.floor).toBe('Lantai 2');
      // is_simulated MUST NOT be in the validated output
      expect(value.is_simulated).toBeUndefined();
      expect(value.unknown_field).toBeUndefined();
    });

    it('accepts number for floor and coerces to string', () => {
      const payload = {
        room_name: 'Room 301',
        floor: 3,
        capacity: 30
      };

      const { error, value } = createRoomSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.floor).toBe('3');
      expect(typeof value.floor).toBe('string');
    });

    it('rejects floor longer than 20 characters', () => {
      const payload = {
        room_name: 'Room 302',
        floor: 'Lantai Sangat Panjang Sekali Lebih Dari Dua Puluh Karakter'
      };

      const { error } = createRoomSchema.validate(payload);
      expect(error).toBeDefined();
    });

    it('rejects payload with empty room_name', () => {
      const payload = {
        room_name: '',
        capacity: 30
      };

      const { error } = createRoomSchema.validate(payload);
      expect(error).toBeDefined();
      expect(error.details[0].message).toMatch(/nama ruangan/i);
    });

    it('rejects payload with capacity <= 0 (0 or negative)', () => {
      const payloadZero = {
        room_name: 'Room A',
        capacity: 0
      };
      const resZero = createRoomSchema.validate(payloadZero);
      expect(resZero.error).toBeDefined();

      const payloadNegative = {
        room_name: 'Room B',
        capacity: -5
      };
      const resNegative = createRoomSchema.validate(payloadNegative);
      expect(resNegative.error).toBeDefined();
    });
  });

  describe('updateRoomSchema', () => {
    it('accepts valid partial update and strips is_simulated', () => {
      const payload = {
        capacity: 50,
        is_simulated: true, // Should be stripped!
        hack: 'exploit'
      };

      const { error, value } = updateRoomSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.capacity).toBe(50);
      expect(value.is_simulated).toBeUndefined();
      expect(value.hack).toBeUndefined();
    });

    it('accepts number for floor and coerces to string in update', () => {
      const payload = {
        floor: 4
      };

      const { error, value } = updateRoomSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.floor).toBe('4');
      expect(typeof value.floor).toBe('string');
    });

    it('rejects capacity <= 0 in update', () => {
      const { error: errZero } = updateRoomSchema.validate({ capacity: 0 });
      expect(errZero).toBeDefined();

      const { error: errNeg } = updateRoomSchema.validate({ capacity: -10 });
      expect(errNeg).toBeDefined();
    });

    it('allows nullifying location or building', () => {
      const payload = {
        location: null,
        building: null
      };

      const { error, value } = updateRoomSchema.validate(payload);
      expect(error).toBeUndefined();
      expect(value.location).toBeNull();
      expect(value.building).toBeNull();
    });
  });
});
