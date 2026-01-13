export class PayloadGenerator {
	generate(config, repository) {
		const requiredReviewers = [];

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
			target: "branch",
			source_type: "Repository",
			source: repository,
			enforcement: "active",
			conditions: {
				ref_name: {
					exclude: [],
					include: ["~DEFAULT_BRANCH"],
				},
			},
			rules: [
				{
					type: "pull_request",
					parameters: {
						required_approving_review_count: 0, // Base requirement is 0, specific teams add on top
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
						actor_type: "Team",
						bypass_mode: bypass.mode,
				  }))
				: [],
		};
	}
}
