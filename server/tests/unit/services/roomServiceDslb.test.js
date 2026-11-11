import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockRoomModel = {
  findByPk: jest.fn(),
  create: jest.fn(),
};

const mockDb = {
  Room: mockRoomModel,
  sequelize: {
    query: jest.fn().mockResolvedValue([])
  }
};

jest.unstable_mockModule('../../../app/models/index.js', () => ({
  default: mockDb,
  sequelize: mockDb.sequelize
}));

const roomService = await import('../../../app/services/roomService.js');

describe('roomService DSLB protections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('roomService.update strips is_simulated and converts empty strings to null', async () => {
    const mockRoomInstance = {
      room_id: 'ROM-1234',
      room_name: 'Original Room',
      update: jest.fn().mockImplementation(async (fields) => fields)
    };

    mockRoomModel.findByPk.mockResolvedValue(mockRoomInstance);

    const updatePayload = {
      room_name: 'New Room Name',
      capacity: 35,
      building: '', // MUST BECOME NULL
      floor: '   ', // whitespace only MUST BECOME NULL
      location: '', // MUST BECOME NULL
      is_simulated: true, // MUST BE STRIPPED
      malicious_field: 'drop table' // MUST BE STRIPPED
    };

    await roomService.update('ROM-1234', updatePayload);

    expect(mockRoomInstance.update).toHaveBeenCalledTimes(1);
    const passedFields = mockRoomInstance.update.mock.calls[0][0];

    expect(passedFields.room_name).toBe('New Room Name');
    expect(passedFields.capacity).toBe(35);
    expect(passedFields.building).toBeNull();
    expect(passedFields.floor).toBeNull();
    expect(passedFields.location).toBeNull();
    expect(passedFields.is_simulated).toBeUndefined();
    expect(passedFields.malicious_field).toBeUndefined();
  });

  it('roomService.create converts empty strings to null and strips is_simulated', async () => {
    mockRoomModel.create.mockImplementation(async (fields) => ({ ...fields, room_id: 'ROM-NEW' }));

    const createPayload = {
      room_name: 'Created Room',
      capacity: 50,
      building: '',
      floor: '',
      location: '   ',
      is_simulated: true
    };

    await roomService.create(createPayload);

    expect(mockRoomModel.create).toHaveBeenCalledTimes(1);
    const passedFields = mockRoomModel.create.mock.calls[0][0];

    expect(passedFields.room_name).toBe('Created Room');
    expect(passedFields.capacity).toBe(50);
    expect(passedFields.building).toBeNull();
    expect(passedFields.floor).toBeNull();
    expect(passedFields.location).toBeNull();
    expect(passedFields.is_simulated).toBeUndefined();
  });
});
