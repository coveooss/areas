import { PathMatcher } from "./path-matcher.js";

export class LabelManager {
	constructor(octokit, owner, repo) {
		this.octokit = octokit;
		this.owner = owner;
		this.repo = repo;
		this.pathMatcher = new PathMatcher();
	}

	async processPR(prNumber, configs) {
		console.log(`Processing PR #${prNumber}`);

		const changedFiles = await this.getChangedFiles(prNumber);
		console.log(`Found ${changedFiles.length} changed files`);

		const desiredLabels = new Set();
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

	async getChangedFiles(prNumber) {
		return await this.octokit.paginate(
			this.octokit.rest.pulls.listFiles,
			{
				owner: this.owner,
				repo: this.repo,
				pull_number: prNumber,
				per_page: 100,
			},
			(response) => response.data.map((file) => file.filename),
		);
	}

	isAreaMatched(config, changedFiles) {
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

	async updateLabels(prNumber, desiredLabels) {
		const currentLabelsResponse = await this.octokit.rest.issues.listLabelsOnIssue(
			{
				owner: this.owner,
				repo: this.repo,
				issue_number: prNumber,
			},
		);

		const currentLabels = currentLabelsResponse.data.map((l) => l.name);
		const currentAreaLabels = currentLabels.filter(
			(l) => l.startsWith("area:") || l.startsWith("team:"),
		);

		// Labels to add
		const labelsToAdd = [...desiredLabels].filter(
			(l) => !currentLabels.includes(l),
		);

		// Labels to remove
		const labelsToRemove = currentAreaLabels.filter(
			(l) => !desiredLabels.has(l),
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
