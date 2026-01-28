import type { BypassActorType, BypassConfig, TeamResolver } from "./types.js";

const VALID_ACTOR_PREFIXES = ["team", "role", "integration"] as const;
type ActorPrefix = (typeof VALID_ACTOR_PREFIXES)[number];

const VALID_BYPASS_MODES = ["always", "pull_request", "exempt"] as const;
type BypassMode = (typeof VALID_BYPASS_MODES)[number];

export class BypassRuleParser {
	private teamResolver: TeamResolver;

	constructor(teamResolver: TeamResolver) {
		this.teamResolver = teamResolver;
	}

	async parse(key: string, mode: string): Promise<BypassConfig> {
		const { prefix, identifier } = this.parseKey(key);

		if (!VALID_BYPASS_MODES.includes(mode as BypassMode)) {
			throw new Error(
				`Invalid bypass mode '${mode}' for '${key}'. ` +
					`Valid modes are: ${VALID_BYPASS_MODES.join(", ")}`,
			);
		}

		let actorId: number;
		let actorType: BypassActorType;

		switch (prefix) {
			case "team": {
				actorId = await this.teamResolver.resolveTeamId(identifier);
				actorType = "Team";
				break;
			}
			case "role": {
				actorId = Number.parseInt(identifier, 10);
				if (Number.isNaN(actorId)) {
					throw new Error(
						`Invalid role ID '${identifier}' in '${key}': role ID must be a number`,
					);
				}
				actorType = "RepositoryRole";
				break;
			}
			case "integration": {
				actorId = Number.parseInt(identifier, 10);
				if (Number.isNaN(actorId)) {
					throw new Error(
						`Invalid integration ID '${identifier}' in '${key}': integration ID must be a number`,
					);
				}
				actorType = "Integration";
				break;
			}
		}

		return {
			bypass_mode: mode as BypassMode,
			actor_id: actorId,
			actor_type: actorType,
		};
	}

	private parseKey(key: string): { prefix: ActorPrefix; identifier: string } {
		const slashIndex = key.indexOf("/");

		// No prefix defaults to team
		if (slashIndex === -1) {
			return { prefix: "team", identifier: key };
		}

		const prefix = key.substring(0, slashIndex).toLowerCase() as ActorPrefix;
		const identifier = key.substring(slashIndex + 1);

		if (!VALID_ACTOR_PREFIXES.includes(prefix)) {
			throw new Error(
				`Invalid review_bypass actor type '${prefix}' in '${key}'. ` +
					`Valid types are: ${VALID_ACTOR_PREFIXES.join(", ")}`,
			);
		}

		if (!identifier) {
			throw new Error(
				`Invalid review_bypass key '${key}': identifier after '${prefix}/' cannot be empty`,
			);
		}

		return { prefix, identifier };
	}
}
