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

	it("should generate bypass_actors payload for team", () => {
		const generator = new PayloadGenerator();
		const config = {
			name: "bypass-area",
			reviewers: {},
			review_bypass: [
				{
					bypass_mode: "pull_request" as const,
					actor_id: 999,
					actor_type: "Team" as const,
				},
			],
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

	it("should generate bypass_actors for multiple actor types", () => {
		const generator = new PayloadGenerator();
		const config = {
			name: "bypass-area",
			reviewers: {},
			review_bypass: [
				{
					bypass_mode: "always" as const,
					actor_id: 999,
					actor_type: "Team" as const,
				},
				{
					bypass_mode: "always" as const,
					actor_id: 5,
					actor_type: "RepositoryRole" as const,
				},
				{
					bypass_mode: "pull_request" as const,
					actor_id: 139346,
					actor_type: "Integration" as const,
				},
			],
			file_patterns: ["*.md"],
		};

		const payload = generator.generate(config, "coveo/test");

		expect(payload.bypass_actors).toHaveLength(3);
		expect(payload.bypass_actors).toEqual([
			{ actor_id: 999, actor_type: "Team", bypass_mode: "always" },
			{ actor_id: 5, actor_type: "RepositoryRole", bypass_mode: "always" },
			{
				actor_id: 139346,
				actor_type: "Integration",
				bypass_mode: "pull_request",
			},
		]);
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

	describe("branches", () => {
		const config = {
			name: "test-area",
			reviewers: {},
			file_patterns: ["*.ts"],
		};

		it("should target the default branch by default", () => {
			const payload = new PayloadGenerator().generate(config, "coveo/test");

			expect(payload.conditions.ref_name).toEqual({
				exclude: [],
				include: ["~DEFAULT_BRANCH"],
			});
		});

		it("should target the given branches, as full refs and without duplicates", () => {
			const generator = new PayloadGenerator([
				"~DEFAULT_BRANCH",
				" v3 ",
				"refs/heads/v3",
				"refs/heads/release/*",
			]);

			const payload = generator.generate(config, "coveo/test");

			expect(payload.conditions.ref_name.include).toEqual([
				"~DEFAULT_BRANCH",
				"refs/heads/v3",
				"refs/heads/release/*",
			]);
		});

		it("should fall back to the default branch when every line is empty", () => {
			const payload = new PayloadGenerator(["", "  "]).generate(
				config,
				"coveo/test",
			);

			expect(payload.conditions.ref_name.include).toEqual(["~DEFAULT_BRANCH"]);
		});
	});
});
