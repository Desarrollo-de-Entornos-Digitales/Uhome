import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service.js';
import { Permission } from './permission.entity.js';

describe('PermissionsService', () => {
  let service: PermissionsService;

  const mockPermissionsRepository = {
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionsRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all permissions', async () => {
    const permissions = [
      { id: 1, name: 'CREATE_PROPERTY' },
      { id: 2, name: 'DELETE_PROPERTY' },
    ];

    mockPermissionsRepository.find.mockResolvedValue(permissions);

    const result = await service.findAll();

    expect(result).toEqual(permissions);
    expect(mockPermissionsRepository.find).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array when there are no permissions', async () => {
    mockPermissionsRepository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  it('should propagate an error if the repository fails', async () => {
    const error = new Error('Database error');

    mockPermissionsRepository.find.mockRejectedValue(error);

    await expect(service.findAll()).rejects.toThrow('Database error');
  });
});