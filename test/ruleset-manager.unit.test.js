import { jest } from "@jest/globals";
import { RulesetManager } from "../src/ruleset-manager.js";

describe("RulesetManager", () => {
    let mockOctokit;
    let manager;

    beforeEach(() => {
        mockOctokit = {
            rest: {
                repos: {
                    getRepoRulesets: jest.fn(),
                    createRepoRuleset: jest.fn(),
                    updateRepoRuleset: jest.fn()
                }
            }
        };
        manager = new RulesetManager(mockOctokit, "owner", "repo");
    });

    it("should create ruleset if it does not exist", async () => {
        mockOctokit.rest.repos.getRepoRulesets.mockResolvedValue({ data: [] });
        mockOctokit.rest.repos.createRepoRuleset.mockResolvedValue({ data: { id: 1 } });

        await manager.createOrUpdateRuleset({ name: "Areas Reviewers" });

        expect(mockOctokit.rest.repos.createRepoRuleset).toHaveBeenCalledWith(expect.objectContaining({
            name: "Areas Reviewers",
            owner: "owner",
            repo: "repo"
        }));
    });

    it("should update ruleset if it exists", async () => {
        // Mock getRepoRulesets to return an existing ruleset
        mockOctokit.rest.repos.getRepoRulesets.mockResolvedValue({ 
            data: [{ name: "Areas Reviewers", id: 999 }] 
        });
        mockOctokit.rest.repos.updateRepoRuleset.mockResolvedValue({ data: { id: 999 } });

        await manager.createOrUpdateRuleset({ name: "Areas Reviewers" });

        expect(mockOctokit.rest.repos.updateRepoRuleset).toHaveBeenCalledWith(expect.objectContaining({
            ruleset_id: 999,
            name: "Areas Reviewers",
            owner: "owner",
            repo: "repo"
        }));
    });
});
