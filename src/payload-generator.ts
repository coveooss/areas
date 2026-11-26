import type { AreaConfig, RulesetPayload } from "./types.js";

const DEFAULT_BRANCH = "~DEFAULT_BRANCH";

export function toRefPattern(branch: string): string {
	return branch.startsWith("~") || branch.startsWith("refs/")
		? branch
		: `refs/heads/${branch}`;
}

export class PayloadGenerator {
	private readonly refPatterns: string[];

	constructor(branches: string[] = []) {
		const patterns = branches
			.map((branch) => branch.trim())
			.filter((branch) => branch !== "")
			.map(toRefPattern);
		this.refPatterns =
			patterns.length > 0 ? [...new Set(patterns)] : [DEFAULT_BRANCH];
	}

	generate(config: AreaConfig, repository: string): RulesetPayload {
		const requiredReviewers: RulesetPayload["rules"][0]["parameters"]["required_reviewers"] =
			[];

		if (config.reviewers) {
			requiredReviewers.push(
				...Object.values(config.reviewers).map((reviewerConfig) => ({
					minimum_approvals: reviewerConfig.minimum_approvals,
					file_patterns: config.file_patterns,
					reviewer: {
						id: reviewerConfig.team_id,
						type: "Team",
					},
				})),
			);
		}

		return {
			name: `area:${config.name}`,
			target: "branch" as const,
			source_type: "Repository",
			source: repository,
			enforcement: "active" as const,
			conditions: {
				ref_name: {
					exclude: [],
					include: [...this.refPatterns],
				},
			},
			rules: [
				{
					type: "pull_request" as const,
					parameters: {
						required_approving_review_count: 0,
						dismiss_stale_reviews_on_push: false,
						require_code_owner_review: false,
						require_last_push_approval: false,
						required_review_thread_resolution: false,
						required_reviewers: requiredReviewers,
					},
				},
			],
			bypass_actors: config.review_bypass ?? [],
		};
	}
}
