import path from "node:path";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { labelPr } from "./commands/label-pr.js";
import { rulesetSync } from "./commands/ruleset-sync.js";
import { ConfigurationReader } from "./configuration-reader.js";
import { TeamResolver } from "./team-resolver.js";

async function run() {
	try {
		const token = core.getInput("token", { required: true });
		const workingDirectory = core.getInput("working-directory") || ".";
		const command = core.getInput("command", { required: true });
		const areasDir = path.join(workingDirectory, ".areas");

		const octokit = github.getOctokit(token);
		const { owner, repo } = github.context.repo;

		const teamResolver = new TeamResolver(octokit, owner);
		const configurationReader = new ConfigurationReader(areasDir, teamResolver);

		if (command === "ruleset-sync") {
			await rulesetSync(octokit, owner, repo, configurationReader);
		} else if (command === "label-pr") {
			await labelPr(octokit, owner, repo, configurationReader);
		} else {
			core.setFailed(`Unknown command: ${command}`);
		}
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
