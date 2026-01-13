import { PayloadGenerator } from "../payload-generator.js";
import { RulesetManager } from "../ruleset-manager.js";

export async function rulesetSync(octokit, owner, repo, configurationReader) {
	const payloadGenerator = new PayloadGenerator();
	const rulesetManager = new RulesetManager(octokit, owner, repo);

	// Read area configurations
	const configs = await configurationReader.readConfigurations();
	const activeAreaNames = new Set(configs.map((c) => `area:${c.name}`));

	// Delete stale rulesets
	try {
		const existingRulesets = await rulesetManager.getRulesets();
		const staleRulesets = existingRulesets.filter(
			(r) => r.name.startsWith("area:") && !activeAreaNames.has(r.name),
		);

		if (staleRulesets.length > 0) {
			console.log(
				`Found ${staleRulesets.length} stale area rulesets. Deleting...`,
			);
			for (const ruleset of staleRulesets) {
				console.log(`Deleting stale ruleset: ${ruleset.name}`);
				await rulesetManager.deleteRuleset(ruleset.id);
			}
		}
	} catch (error) {
		console.warn(
			"Failed to clean up stale rulesets (likely due to permissions or API error):",
			error.message,
		);
	}

	for (const config of configs) {
		const payload = payloadGenerator.generate(config, `${owner}/${repo}`);
		await rulesetManager.createOrUpdateRuleset(payload);
	}
}
