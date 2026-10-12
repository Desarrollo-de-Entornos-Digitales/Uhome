import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PropertyTypesService } from './property-types.service.js';
import { PropertyType } from './property-type.entity.js';

describe('PropertyTypesService', () => {
  let service: PropertyTypesService;

  const mockPropertyTypesRepository = {
    findOneBy: vi.fn(),
    save: vi.fn(),
    find: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyTypesService,
        {
          provide: getRepositoryToken(PropertyType),
          useValue: mockPropertyTypesRepository,
        },
      ],
    }).compile();

    service = module.get<PropertyTypesService>(PropertyTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create the default property types when they do not exist', async () => {
    mockPropertyTypesRepository.findOneBy.mockResolvedValue(null);
    mockPropertyTypesRepository.save.mockResolvedValue({});

    await service.onModuleInit();

    expect(mockPropertyTypesRepository.findOneBy).toHaveBeenCalledTimes(4);
    expect(mockPropertyTypesRepository.save).toHaveBeenCalledTimes(4);

    expect(mockPropertyTypesRepository.save).toHaveBeenCalledWith({
      name: 'apartamento',
    });
    expect(mockPropertyTypesRepository.save).toHaveBeenCalledWith({
      name: 'casa',
    });
    expect(mockPropertyTypesRepository.save).toHaveBeenCalledWith({
      name: 'habitación',
    });
    expect(mockPropertyTypesRepository.save).toHaveBeenCalledWith({
      name: 'apartaestudio',
    });
  });

  it('should not create property types that already exist', async () => {
    mockPropertyTypesRepository.findOneBy.mockResolvedValue({
      id: 1,
      name: 'apartamento',
    });

    await service.onModuleInit();

    expect(mockPropertyTypesRepository.findOneBy).toHaveBeenCalledTimes(4);
    expect(mockPropertyTypesRepository.save).not.toHaveBeenCalled();
  });

  it('should create only the property types that are missing', async () => {
    mockPropertyTypesRepository.findOneBy
      .mockResolvedValueOnce({ id: 1, name: 'apartamento' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 3, name: 'habitación' })
      .mockResolvedValueOnce(null);

    mockPropertyTypesRepository.save.mockResolvedValue({});

    await service.onModuleInit();

    expect(mockPropertyTypesRepository.save).toHaveBeenCalledTimes(2);
    expect(mockPropertyTypesRepository.save).toHaveBeenCalledWith({
      name: 'casa',
    });
    expect(mockPropertyTypesRepository.save).toHaveBeenCalledWith({
      name: 'apartaestudio',
    });
  });

  it('should return all property types', async () => {
    const propertyTypes = [
      { id: 1, name: 'apartamento' },
      { id: 2, name: 'casa' },
    ];

    mockPropertyTypesRepository.find.mockResolvedValue(propertyTypes);

    const result = await service.findAll();

    expect(result).toEqual(propertyTypes);
    expect(mockPropertyTypesRepository.find).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array when there are no property types', async () => {
    mockPropertyTypesRepository.find.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });
});