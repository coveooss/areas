import { jest } from "@jest/globals";
import { TeamResolver } from "../src/team-resolver.js";

describe("TeamResolver", () => {
	it("should resolve team id", async () => {
		const mockOctokit = {
			rest: {
				teams: {
					getByName: jest.fn().mockResolvedValue({ data: { id: 456 } }),
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
});
