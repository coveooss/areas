import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOctokit } from "@actions/github";
import { ConfigurationReader } from "../src/configuration-reader.js";
import { PayloadGenerator } from "../src/payload-generator.js";
import { RulesetManager } from "../src/ruleset-manager.js";
import { TeamResolver } from "../src/team-resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.GITHUB_TOKEN;
const owner = process.env.OWNER || "coveo";
const repo = process.env.REPO || "glowing-potato";

const describeIntegration = token ? describe : describe.skip;

describeIntegration("Integration Test", () => {
	let octokit;

	beforeAll(() => {
		if (!token) {
			return;
		}

		octokit = getOctokit(token);
	});

	it("should create or update ruleset", async () => {
		const resolver = new TeamResolver(octokit, owner);
		const manager = new RulesetManager(octokit, owner, repo);
		const generator = new PayloadGenerator();

		const areasDir = path.resolve(__dirname, "../../../../.areas");
		console.log(`Reading configurations from ${areasDir}`);

		const reader = new ConfigurationReader(areasDir, resolver);
		const configs = await reader.readConfigurations();

		for (const config of configs) {
			const payload = generator.generate(config, `${owner}/${repo}`);

			console.log(JSON.stringify(payload));

			await manager.createOrUpdateRuleset(payload);
		}
	});
});
