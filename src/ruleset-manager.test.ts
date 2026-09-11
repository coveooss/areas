import { beforeEach, describe, expect, it, vi } from "vitest";
import { RulesetManager } from "./ruleset-manager";

describe("RulesetManager", () => {
	let mockOctokit: {
		paginate: ReturnType<typeof vi.fn>;
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
			paginate: vi.fn(),
			rest: {
				repos: {
					getRepoRulesets: vi.fn(),
					createRepoRuleset: vi.fn(),
					updateRepoRuleset: vi.fn(),
					deleteRepoRuleset: vi.fn(),
				},
			},
		};
		manager = new RulesetManager(mockOctokit, "owner", "repo");
	});

	it("should create ruleset if it does not exist", async () => {
		mockOctokit.paginate.mockResolvedValue([]);
		mockOctokit.rest.repos.createRepoRuleset.mockResolvedValue({
			data: { id: 1 },
		});

		await manager.createOrUpdateRuleset({ name: "Areas Reviewers" });

		expect(mockOctokit.rest.repos.createRepoRuleset).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Areas Reviewers",
				owner: "owner",
				repo: "repo",
			}),
		);
	});

	it("should update ruleset if it exists", async () => {
		mockOctokit.paginate.mockResolvedValue([
			{ name: "Areas Reviewers", id: 999 },
		]);
		mockOctokit.rest.repos.updateRepoRuleset.mockResolvedValue({
			data: { id: 999 },
		});

		await manager.createOrUpdateRuleset({ name: "Areas Reviewers" });

		expect(mockOctokit.rest.repos.updateRepoRuleset).toHaveBeenCalledWith(
			expect.objectContaining({
				ruleset_id: 999,
				name: "Areas Reviewers",
				owner: "owner",
				repo: "repo",
			}),
		);
	});

	it("should get all rulesets", async () => {
		const mockRulesets = [{ name: "test", id: 1 }];
		mockOctokit.paginate.mockResolvedValue(mockRulesets);

		const rulesets = await manager.getRulesets();

		expect(rulesets).toEqual(mockRulesets);
		expect(mockOctokit.paginate).toHaveBeenCalledWith(
			mockOctokit.rest.repos.getRepoRulesets,
			expect.objectContaining({
				owner: "owner",
				repo: "repo",
				per_page: 100,
			}),
		);
	});

	it("should delete a ruleset", async () => {
		mockOctokit.rest.repos.deleteRepoRuleset.mockResolvedValue({});

		await manager.deleteRuleset(123);

		expect(mockOctokit.rest.repos.deleteRepoRuleset).toHaveBeenCalledWith({
			owner: "owner",
			repo: "repo",
			ruleset_id: 123,
		});
	});
});
