import type { Octokit, Ruleset, RulesetPayload } from "./types.js";

export class RulesetManager {
	private octokit: Octokit;
	private owner: string;
	private repo: string;

	constructor(octokit: Octokit, owner: string, repo: string) {
		this.octokit = octokit;
		this.owner = owner;
		this.repo = repo;
	}

	async getRulesets(): Promise<Ruleset[]> {
		const response = await this.octokit.rest.repos.getRepoRulesets({
			owner: this.owner,
			repo: this.repo,
		});
		return response.data as Ruleset[];
	}

	async deleteRuleset(rulesetId: number): Promise<void> {
		await this.octokit.rest.repos.deleteRepoRuleset({
			owner: this.owner,
			repo: this.repo,
			ruleset_id: rulesetId,
		});
		console.log(`Deleted ruleset ID: ${rulesetId}`);
	}

	async createOrUpdateRuleset(payload: RulesetPayload): Promise<void> {
		const rulesets = await this.getRulesets();

		const existingRuleset = rulesets.find((r) => r.name === payload.name);

		if (existingRuleset) {
			await this.octokit.rest.repos.updateRepoRuleset({
				owner: this.owner,
				repo: this.repo,
				ruleset_id: existingRuleset.id,
				...payload,
			});
			console.log(
				`Updated ruleset '${payload.name}' (ID: ${existingRuleset.id})`,
			);
		} else {
			await this.octokit.rest.repos.createRepoRuleset({
				owner: this.owner,
				repo: this.repo,
				...payload,
			});
			console.log(`Created ruleset '${payload.name}'`);
		}
	}
}
