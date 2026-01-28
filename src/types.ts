import type { getOctokit } from "@actions/github";

export type Octokit = ReturnType<typeof getOctokit>;

export interface ReviewerConfig {
	minimum_approvals: number;
	team_id: number;
}

export type BypassActorType = "Team" | "RepositoryRole" | "Integration";

export interface BypassConfig {
	bypass_mode: "always" | "pull_request" | "exempt";
	actor_id: number;
	actor_type: BypassActorType;
}

export interface AreaConfig {
	name: string;
	description?: string;
	file_patterns: string[];
	reviewers: Record<string, ReviewerConfig>;
	review_bypass?: BypassConfig[];
}

export interface TeamResolver {
	resolveTeamId(teamSlug: string): Promise<number>;
}

export interface RulesetPayload {
	name: string;
	target: "branch" | "tag";
	source_type: string;
	source: string;
	enforcement: "active" | "disabled" | "evaluate";
	conditions: {
		ref_name: {
			exclude: string[];
			include: string[];
		};
	};
	rules: Array<{
		type: "pull_request";
		parameters: {
			required_approving_review_count: number;
			dismiss_stale_reviews_on_push: boolean;
			require_code_owner_review: boolean;
			require_last_push_approval: boolean;
			required_review_thread_resolution: boolean;
			required_reviewers: Array<{
				minimum_approvals: number;
				file_patterns: string[];
				reviewer: {
					id: number;
					type: string;
				};
			}>;
		};
	}>;
	bypass_actors: Array<{
		actor_id: number;
		actor_type: "Team" | "RepositoryRole" | "Integration" | "OrganizationAdmin";
		bypass_mode: "always" | "pull_request" | "exempt";
	}>;
}

export interface Ruleset {
	id: number;
	name: string;
}
