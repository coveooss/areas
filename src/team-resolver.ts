export class TeamResolver {
	constructor(octokit, org) {
		this.octokit = octokit;
		this.org = org;
	}

	async resolveTeamId(teamSlug) {
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
