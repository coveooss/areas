import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RulesetManager } from './ruleset-manager';

describe('RulesetManager', () => {
  let mockOctokit: {
    rest: {
      repos: {
        getRepoRulesets: ReturnType<typeof vi.fn>;
        createRepoRuleset: ReturnType<typeof vi.fn>;
        updateRepoRuleset: ReturnType<typeof vi.fn>;
        deleteRepoRuleset: ReturnType<typeof vi.fn>;
      };
    };
  };
  let manager: RulesetManager;

  beforeEach(() => {
    mockOctokit = {
      rest: {
        repos: {
          getRepoRulesets: vi.fn(),
          createRepoRuleset: vi.fn(),
          updateRepoRuleset: vi.fn(),
          deleteRepoRuleset: vi.fn(),
        },
      },
    };
    manager = new RulesetManager(mockOctokit, 'owner', 'repo');
  });

  it('should create ruleset if it does not exist', async () => {
    mockOctokit.rest.repos.getRepoRulesets.mockResolvedValue({ data: [] });
    mockOctokit.rest.repos.createRepoRuleset.mockResolvedValue({ data: { id: 1 } });

    await manager.createOrUpdateRuleset({ name: 'Areas Reviewers' });

    expect(mockOctokit.rest.repos.createRepoRuleset).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Areas Reviewers',
        owner: 'owner',
        repo: 'repo',
      })
    );
  });

  it('should update ruleset if it exists', async () => {
    mockOctokit.rest.repos.getRepoRulesets.mockResolvedValue({
      data: [{ name: 'Areas Reviewers', id: 999 }],
    });
    mockOctokit.rest.repos.updateRepoRuleset.mockResolvedValue({ data: { id: 999 } });

    await manager.createOrUpdateRuleset({ name: 'Areas Reviewers' });

    expect(mockOctokit.rest.repos.updateRepoRuleset).toHaveBeenCalledWith(
      expect.objectContaining({
        ruleset_id: 999,
        name: 'Areas Reviewers',
        owner: 'owner',
        repo: 'repo',
      })
    );
  });

  it('should get all rulesets', async () => {
    const mockRulesets = [{ name: 'test', id: 1 }];
    mockOctokit.rest.repos.getRepoRulesets.mockResolvedValue({ data: mockRulesets });

    const rulesets = await manager.getRulesets();

    expect(rulesets).toEqual(mockRulesets);
  });

  it('should delete a ruleset', async () => {
    mockOctokit.rest.repos.deleteRepoRuleset.mockResolvedValue({});

    await manager.deleteRuleset(123);

    expect(mockOctokit.rest.repos.deleteRepoRuleset).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ruleset_id: 123,
    });
  });
});
