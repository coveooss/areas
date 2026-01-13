import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { PayloadGenerator } from './payload-generator';

describe('Bypass Feature', () => {
  const mockGlobSync = vi.mocked(globSync);
  const mockReadFile = vi.mocked(fs.readFile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ConfigurationReader', () => {
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

  describe('PayloadGenerator', () => {
    it('should generate bypass_actors payload', () => {
      const generator = new PayloadGenerator();
      const config = {
        name: 'bypass-area',
        reviewers: {},
        review_bypass: {
          'bypass-team': {
            mode: 'pull_request',
            team_id: 999,
          },
        },
        file_patterns: ['*.md'],
      };

      const payload = generator.generate(config, 'coveo/test');

      expect(payload.bypass_actors).toHaveLength(1);
      expect(payload.bypass_actors[0]).toEqual({
        actor_id: 999,
        actor_type: 'Team',
        bypass_mode: 'pull_request',
      });
    });

    it('should generate empty bypass_actors when no bypass configured', () => {
      const generator = new PayloadGenerator();
      const config = {
        name: 'no-bypass-area',
        reviewers: {},
        file_patterns: ['*.js'],
      };

      const payload = generator.generate(config, 'coveo/test');

      expect(payload.bypass_actors).toHaveLength(0);
    });
  });
});
