import type { Octokit } from "./types.js";

export class TeamResolver {
	private octokit: Octokit;
	private org: string;

	constructor(octokit: Octokit, org: string) {
		this.octokit = octokit;
		this.org = org;
	}

	async resolveTeamId(teamSlug: string): Promise<number> {
		try {
			const response = await this.octokit.rest.teams.getByName({
				org: this.org,
				team_slug: teamSlug,
			});
			return response.data.id;
		} catch (error) {
			throw new Error(
				`Failed to resolve team ID for slug '${this.org}/${teamSlug}': ${error}`,
			);
		}
	}
}
