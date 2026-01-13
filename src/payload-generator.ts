import type { AreaConfig, RulesetPayload } from "./types.js";

export class PayloadGenerator {
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
					include: ["~DEFAULT_BRANCH"],
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
			bypass_actors: config.review_bypass
				? Object.values(config.review_bypass).map((bypass) => ({
						actor_id: bypass.team_id,
						actor_type: "Team" as const,
						bypass_mode: bypass.mode,
					}))
				: [],
		};
	}
}
