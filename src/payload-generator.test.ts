import { describe, expect, it } from "vitest";
import { PayloadGenerator } from "./payload-generator";

describe("PayloadGenerator", () => {
	it("should generate correct payload", () => {
		const generator = new PayloadGenerator();
		const config = {
			name: "test-area",
			description: "Test Area",
			reviewers: {
				"test-team": {
					minimum_approvals: 1,
					team_id: 123,
				},
			},
			file_patterns: ["*.ts"],
		};

		const payload = generator.generate(config, "coveo/glowing-potato");

		expect(payload.name).toBe("area:test-area");
		expect(payload.rules[0].type).toBe("pull_request");
		expect(payload.rules[0].parameters.required_reviewers).toHaveLength(1);
		expect(payload.rules[0].parameters.required_reviewers[0]).toEqual({
			minimum_approvals: 1,
			file_patterns: ["*.ts"],
			reviewer: {
				id: 123,
				type: "Team",
			},
		});
	});

	it("should handle multiple reviewers", () => {
		const generator = new PayloadGenerator();
		const config = {
			name: "test-area",
			description: "Test Area",
			reviewers: {
				"team-a": { minimum_approvals: 1, team_id: 101 },
				"team-b": { minimum_approvals: 2, team_id: 102 },
			},
			file_patterns: ["*.js"],
		};

		const payload = generator.generate(config, "coveo/glowing-potato");

		expect(payload.rules[0].parameters.required_reviewers).toHaveLength(2);
		expect(payload.rules[0].parameters.required_reviewers).toEqual(
			expect.arrayContaining([
				{
					minimum_approvals: 1,
					file_patterns: ["*.js"],
					reviewer: { id: 101, type: "Team" },
				},
				{
					minimum_approvals: 2,
					file_patterns: ["*.js"],
					reviewer: { id: 102, type: "Team" },
				},
			]),
		);
	});

	it("should generate bypass_actors payload", () => {
		const generator = new PayloadGenerator();
		const config = {
			name: "bypass-area",
			reviewers: {},
			review_bypass: {
				"bypass-team": {
					mode: "pull_request",
					team_id: 999,
				},
			},
			file_patterns: ["*.md"],
		};

		const payload = generator.generate(config, "coveo/test");

		expect(payload.bypass_actors).toHaveLength(1);
		expect(payload.bypass_actors[0]).toEqual({
			actor_id: 999,
			actor_type: "Team",
			bypass_mode: "pull_request",
		});
	});

	it("should handle empty reviewers", () => {
		const generator = new PayloadGenerator();
		const config = {
			name: "empty-area",
			reviewers: {},
			file_patterns: ["*.txt"],
		};

		const payload = generator.generate(config, "coveo/test");

		expect(payload.rules[0].parameters.required_reviewers).toHaveLength(0);
		expect(payload.bypass_actors).toHaveLength(0);
	});
});
