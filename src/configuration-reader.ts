import path from "node:path";
import fs from "fs-extra";
import { globSync } from "glob";
import yaml from "js-yaml";
import type { AreaConfig, TeamResolver } from "./types.js";

interface RawConfig {
	name?: string;
	description?: string;
	file_patterns?: string[];
	reviewers?: Record<string, { minimum_approvals?: number } | null>;
	review_bypass?: Record<string, string>;
}

export class ConfigurationReader {
	private areasDir: string;
	private teamResolver: TeamResolver;

	constructor(areasDir: string, teamResolver: TeamResolver) {
		this.areasDir = areasDir;
		this.teamResolver = teamResolver;
	}

	async readConfigurations(): Promise<AreaConfig[]> {
		const files = globSync(`${this.areasDir}/*.{yml,yaml}`);
		const configs: AreaConfig[] = [];

		for (const file of files) {
			const content = await fs.readFile(file, "utf8");
			const rawConfig = yaml.load(content) as RawConfig;

			const areaName = path.basename(file, path.extname(file));
			const config: AreaConfig = {
				name: areaName,
				description: rawConfig.description,
				file_patterns: rawConfig.file_patterns || [],
				reviewers: {},
				review_bypass: undefined,
			};

			// Add the config file itself to the patterns so changes to it trigger the area rules
			const relativeConfigPath = `${path.basename(this.areasDir)}/${path.relative(this.areasDir, path.resolve(file))}`;
			config.file_patterns.push(relativeConfigPath);

			console.log(`Processing area config: ${file}`);

			if (rawConfig.reviewers) {
				for (const [teamSlug, reviewerConfig] of Object.entries(
					rawConfig.reviewers,
				)) {
					const minimumApprovals = reviewerConfig?.minimum_approvals ?? 0;
					const teamId = await this.teamResolver.resolveTeamId(teamSlug);
					config.reviewers[teamSlug] = {
						minimum_approvals: minimumApprovals,
						team_id: teamId,
					};
				}
			}

			if (rawConfig.review_bypass) {
				config.review_bypass = {};
				for (const [teamSlug, mode] of Object.entries(
					rawConfig.review_bypass,
				)) {
					const teamId = await this.teamResolver.resolveTeamId(teamSlug);
					config.review_bypass[teamSlug] = {
						mode: mode as "always" | "pull_request",
						team_id: teamId,
					};
				}
			}

			configs.push(config);
		}
		return configs;
	}
}
