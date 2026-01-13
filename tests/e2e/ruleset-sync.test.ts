import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOctokit } from "@actions/github";
import { beforeAll, describe, it } from "vitest";
import { ConfigurationReader } from "../../src/configuration-reader";
import { PayloadGenerator } from "../../src/payload-generator";
import { RulesetManager } from "../../src/ruleset-manager";
import { TeamResolver } from "../../src/team-resolver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.GITHUB_TOKEN;
const owner = process.env.OWNER || "coveo";
const repo = process.env.REPO || "glowing-potato";

describe.skipIf(!token)("Ruleset Sync Integration Test", () => {
	let octokit: ReturnType<typeof getOctokit>;

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
