import { describe, expect, it, vi } from "vitest";
import { TeamResolver } from "./team-resolver";

describe("TeamResolver", () => {
	it("should resolve team id", async () => {
		const mockOctokit = {
			rest: {
				teams: {
					getByName: vi.fn().mockResolvedValue({ data: { id: 456 } }),
				},
			},
		};

		const resolver = new TeamResolver(mockOctokit, "org");
		const id = await resolver.resolveTeamId("slug");

		expect(id).toBe(456);
		expect(mockOctokit.rest.teams.getByName).toHaveBeenCalledWith({
			org: "org",
			team_slug: "slug",
		});
	});

	it("should throw error when team resolution fails", async () => {
		const mockOctokit = {
			rest: {
				teams: {
					getByName: vi.fn().mockRejectedValue(new Error("Not found")),
				},
			},
		};

		const resolver = new TeamResolver(mockOctokit, "org");

		await expect(resolver.resolveTeamId("invalid-slug")).rejects.toThrow(
			"Failed to resolve team ID for slug 'org/invalid-slug'",
		);
	});
});
