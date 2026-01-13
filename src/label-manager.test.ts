import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PathMatcher } from './path-matcher';
import { LabelManager } from './label-manager';

// Create a mock function that will be used by the mocked PathMatcher
const mockMatch = vi.fn();

// Mock the PathMatcher module
vi.mock('./path-matcher', () => ({
  PathMatcher: class MockPathMatcher {
    match(file: string, pattern: string) {
      return mockMatch(file, pattern);
    }
  },
}));

describe('LabelManager', () => {
  let mockOctokit: {
    paginate: ReturnType<typeof vi.fn>;
    rest: {
      pulls: { listFiles: ReturnType<typeof vi.fn> };
      issues: {
        listLabelsOnIssue: ReturnType<typeof vi.fn>;
        addLabels: ReturnType<typeof vi.fn>;
        removeLabel: ReturnType<typeof vi.fn>;
      };
    };
  };
  let labelManager: LabelManager;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOctokit = {
      paginate: vi.fn(),
      rest: {
        pulls: { listFiles: vi.fn() },
        issues: {
          listLabelsOnIssue: vi.fn(),
          addLabels: vi.fn(),
          removeLabel: vi.fn(),
        },
      },
    };
    labelManager = new LabelManager(mockOctokit, 'owner', 'repo');
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('processPR', () => {
    it('should add area and team labels when patterns match', async () => {
      const prNumber = 123;
      const configs = [
        {
          name: 'test-area',
          file_patterns: ['*.ts'],
          reviewers: { 'some-team': {} },
        },
      ];

      mockOctokit.paginate.mockResolvedValue(['file.ts']);
      mockMatch.mockReturnValue(true);
      mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ data: [] });
      mockOctokit.rest.issues.addLabels.mockResolvedValue({});

      await labelManager.processPR(prNumber, configs);

      expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: prNumber,
        labels: expect.arrayContaining(['area:test-area', 'team:some-team']),
      });
    });

    it('should not add labels when no patterns match', async () => {
      const prNumber = 123;
      const configs = [
        {
          name: 'test-area',
          file_patterns: ['*.ts'],
          reviewers: { 'some-team': {} },
        },
      ];

      mockOctokit.paginate.mockResolvedValue(['file.js']);
      mockMatch.mockReturnValue(false);
      mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ data: [] });

      await labelManager.processPR(prNumber, configs);

      expect(mockOctokit.rest.issues.addLabels).not.toHaveBeenCalled();
    });

    it('should remove stale area labels', async () => {
      const prNumber = 123;
      const configs = [
        {
          name: 'new-area',
          file_patterns: ['*.ts'],
          reviewers: {},
        },
      ];

      mockOctokit.paginate.mockResolvedValue(['file.ts']);
      mockMatch.mockReturnValue(true);
      mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({
        data: [{ name: 'area:old-area' }],
      });
      mockOctokit.rest.issues.addLabels.mockResolvedValue({});
      mockOctokit.rest.issues.removeLabel.mockResolvedValue({});

      await labelManager.processPR(prNumber, configs);

      expect(mockOctokit.rest.issues.removeLabel).toHaveBeenCalledWith({
        owner: 'owner',
        repo: 'repo',
        issue_number: prNumber,
        name: 'area:old-area',
      });
    });
  });

  describe('isAreaMatched', () => {
    it('should return false when no file patterns are defined', () => {
      const config = { name: 'test', file_patterns: [] };
      const changedFiles = ['file.ts'];

      const result = labelManager.isAreaMatched(config, changedFiles);

      expect(result).toBe(false);
    });

    it('should return true when a file matches a pattern', () => {
      const config = { name: 'test', file_patterns: ['*.ts'] };
      const changedFiles = ['file.ts'];

      mockMatch.mockReturnValue(true);

      const result = labelManager.isAreaMatched(config, changedFiles);

      expect(result).toBe(true);
    });
  });
});
