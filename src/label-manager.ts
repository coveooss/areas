import { PathMatcher } from "./path-matcher.js";
import type { AreaConfig, Octokit } from "./types.js";

export class LabelManager {
	private octokit: Octokit;
	private owner: string;
	private repo: string;
	private pathMatcher: PathMatcher;

	constructor(octokit: Octokit, owner: string, repo: string) {
		this.octokit = octokit;
		this.owner = owner;
		this.repo = repo;
		this.pathMatcher = new PathMatcher();
	}

	async processPR(prNumber: number, configs: AreaConfig[]): Promise<void> {
		console.log(`Processing PR #${prNumber}`);

		const changedFiles = await this.getChangedFiles(prNumber);
		console.log(`Found ${changedFiles.length} changed files`);

		const desiredLabels = new Set<string>();
		for (const config of configs) {
			if (this.isAreaMatched(config, changedFiles)) {
				console.log(`Matched area: ${config.name}`);
				desiredLabels.add(`area:${config.name}`);
				if (config.reviewers) {
					for (const teamSlug of Object.keys(config.reviewers)) {
						desiredLabels.add(`team:${teamSlug}`);
					}
				}
			}
		}

		await this.updateLabels(prNumber, desiredLabels);
	}

	async getChangedFiles(prNumber: number): Promise<string[]> {
		return await this.octokit.paginate(
			this.octokit.rest.pulls.listFiles,
			{
				owner: this.owner,
				repo: this.repo,
				pull_number: prNumber,
				per_page: 100,
			},
			(response: { data: Array<{ filename: string }> }) =>
				response.data.map((file: { filename: string }) => file.filename),
		);
	}

	isAreaMatched(config: AreaConfig, changedFiles: string[]): boolean {
		if (!config.file_patterns || config.file_patterns.length === 0) {
			return false;
		}

		for (const file of changedFiles) {
			for (const pattern of config.file_patterns) {
				if (this.pathMatcher.match(file, pattern)) {
					console.log(`  File ${file} matches pattern ${pattern}`);
					return true;
				}
			}
		}
		return false;
	}

	async updateLabels(
		prNumber: number,
		desiredLabels: Set<string>,
	): Promise<void> {
		const currentLabelsResponse =
			await this.octokit.rest.issues.listLabelsOnIssue({
				owner: this.owner,
				repo: this.repo,
				issue_number: prNumber,
			});

		const currentLabels = currentLabelsResponse.data.map(
			(l: { name: string }) => l.name,
		);
		const currentAreaLabels = currentLabels.filter(
			(l: string) => l.startsWith("area:") || l.startsWith("team:"),
		);

		// Labels to add
		const labelsToAdd = [...desiredLabels].filter(
			(l: string) => !currentLabels.includes(l),
		);

		// Labels to remove
		const labelsToRemove = currentAreaLabels.filter(
			(l: string) => !desiredLabels.has(l),
		);

		if (labelsToAdd.length === 0 && labelsToRemove.length === 0) {
			console.log("No label changes needed.");
		}

		if (labelsToAdd.length > 0) {
			console.log(`Adding labels: ${labelsToAdd.join(", ")}`);
			await this.octokit.rest.issues.addLabels({
				owner: this.owner,
				repo: this.repo,
				issue_number: prNumber,
				labels: labelsToAdd,
			});
		}

		if (labelsToRemove.length > 0) {
			console.log(`Removing labels: ${labelsToRemove.join(", ")}`);
			for (const label of labelsToRemove) {
				await this.octokit.rest.issues.removeLabel({
					owner: this.owner,
					repo: this.repo,
					issue_number: prNumber,
					name: label,
				});
			}
		}
	}
}
