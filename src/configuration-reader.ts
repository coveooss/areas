import path from "node:path";
import fs from "fs-extra";
import { globSync } from "glob";
import yaml from "js-yaml";

export class ConfigurationReader {
	constructor(areasDir, teamResolver) {
		this.areasDir = areasDir;
		this.teamResolver = teamResolver;
	}

	async readConfigurations() {
		const files = globSync(`${this.areasDir}/*.{yml,yaml}`);
		const configs = [];

		for (const file of files) {
			const content = await fs.readFile(file, "utf8");
			const config = yaml.load(content);

			const areaName = path.basename(file, path.extname(file));
			config.name = areaName;

			// Add the config file itself to the patterns so changes to it trigger the area rules
			if (!config.file_patterns) {
				config.file_patterns = [];
			}
			const relativeConfigPath = `${path.basename(this.areasDir)}/${path.relative(this.areasDir, path.resolve(file))}`;
			config.file_patterns.push(relativeConfigPath);

			console.log(`Processing area config: ${file}`);

			if (config.reviewers) {
				for (const [teamSlug, reviewerConfig] of Object.entries(
					config.reviewers,
				)) {
					const hydratedConfig = reviewerConfig || { minimum_approvals: 0 };
					const teamId = await this.teamResolver.resolveTeamId(teamSlug);
					hydratedConfig.team_id = teamId;
					config.reviewers[teamSlug] = hydratedConfig;
				}
			}

			if (config.review_bypass) {
				const bypassConfigs = {};
				for (const [teamSlug, mode] of Object.entries(config.review_bypass)) {
					const teamId = await this.teamResolver.resolveTeamId(teamSlug);
					bypassConfigs[teamSlug] = {
						mode: mode,
						team_id: teamId,
					};
				}
				config.review_bypass = bypassConfigs;
			}

			configs.push(config);
		}
		return configs;
	}
}
