import * as github from "@actions/github";
import type { ConfigurationReader } from "../configuration-reader.js";
import { LabelManager } from "../label-manager.js";
import type { Octokit } from "../types.js";

export async function labelPr(
	octokit: Octokit,
	owner: string,
	repo: string,
	configurationReader: ConfigurationReader,
): Promise<void> {
	if (!github.context.payload.pull_request) {
		throw new Error(
			"The 'label-pr' command must be run in the context of a pull_request",
		);
	}
	const prNumber = github.context.issue.number;
	const labelManager = new LabelManager(octokit, owner, repo);

	// Read area configurations
	const configs = await configurationReader.readConfigurations();

	await labelManager.processPR(prNumber, configs);
}
