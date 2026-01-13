import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock modules
vi.mock('glob', () => ({
  globSync: vi.fn(),
}));

vi.mock('fs-extra', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

import { globSync } from 'glob';
import fs from 'fs-extra';
import { ConfigurationReader } from './configuration-reader';

describe('ConfigurationReader', () => {
  const mockGlobSync = vi.mocked(globSync);
  const mockReadFile = vi.mocked(fs.readFile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read configurations and resolve teams', async () => {
    const areasDir = '/tmp/areas';
    const mockResolver = {
      resolveTeamId: vi.fn().mockResolvedValue(123),
    };

    mockGlobSync.mockReturnValue(['/tmp/areas/area1.yml'] as any);
    mockReadFile.mockResolvedValue('reviewers:\n  my-team:\n    minimum_approvals: 1\n' as any);

    const reader = new ConfigurationReader(areasDir, mockResolver);
    const configs = await reader.readConfigurations();

    expect(configs).toHaveLength(1);
    expect(configs[0].reviewers['my-team'].team_id).toBe(123);
    expect(configs[0].reviewers['my-team'].minimum_approvals).toBe(1);
    expect(mockResolver.resolveTeamId).toHaveBeenCalledWith('my-team');
    expect(configs[0].name).toBe('area1');
    expect(mockGlobSync).toHaveBeenCalledWith(`${areasDir}/*.{yml,yaml}`);
  });

  it('should handle nil configuration with default minimum_approvals: 0', async () => {
    const areasDir = '/tmp/areas';
    const mockResolver = {
      resolveTeamId: vi.fn().mockResolvedValue(456),
    };

    mockGlobSync.mockReturnValue(['/tmp/areas/area2.yml'] as any);
    mockReadFile.mockResolvedValue('reviewers:\n  other-team: ~\n' as any);

    const reader = new ConfigurationReader(areasDir, mockResolver);
    const configs = await reader.readConfigurations();

    expect(configs).toHaveLength(1);
    expect(configs[0].reviewers['other-team'].team_id).toBe(456);
    expect(configs[0].reviewers['other-team'].minimum_approvals).toBe(0);
  });

  it('should parse review_bypass and resolve teams', async () => {
    const areasDir = '/tmp/areas';
    const mockResolver = {
      resolveTeamId: vi.fn().mockImplementation(async (slug: string) => {
        if (slug === 'bypass-team') return 999;
        return 0;
      }),
    };

    mockGlobSync.mockReturnValue(['/tmp/areas/bypass.yml'] as any);
    mockReadFile.mockResolvedValue(`
reviewers: {}
review_bypass:
  bypass-team: pull_request
` as any);

    const reader = new ConfigurationReader(areasDir, mockResolver);
    const configs = await reader.readConfigurations();

    expect(configs).toHaveLength(1);
    expect(configs[0].review_bypass).toBeDefined();
    expect(configs[0].review_bypass['bypass-team']).toEqual({
      mode: 'pull_request',
      team_id: 999,
    });
    expect(mockResolver.resolveTeamId).toHaveBeenCalledWith('bypass-team');
  });
});
