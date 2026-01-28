import { beforeEach, describe, expect, it, vi } from "vitest";
import { BypassRuleParser } from "./bypass-rule-parser";

describe("BypassRuleParser", () => {
	let mockTeamResolver: any;

	beforeEach(() => {
		mockTeamResolver = {
			resolveTeamId: vi.fn(),
		};
	});

	describe("parse", () => {
		it("should parse team bypass with team/ prefix", async () => {
			mockTeamResolver.resolveTeamId.mockResolvedValue(123);

			const parser = new BypassRuleParser(mockTeamResolver);
			const result = await parser.parse("team/my-team", "always");

			expect(result).toEqual({
				bypass_mode: "always",
				actor_id: 123,
				actor_type: "Team",
			});
			expect(mockTeamResolver.resolveTeamId).toHaveBeenCalledWith("my-team");
		});

		it("should default to team when no prefix is provided", async () => {
			mockTeamResolver.resolveTeamId.mockResolvedValue(456);

			const parser = new BypassRuleParser(mockTeamResolver);
			const result = await parser.parse("docs-admins", "pull_request");

			expect(result).toEqual({
				bypass_mode: "pull_request",
				actor_id: 456,
				actor_type: "Team",
			});
			expect(mockTeamResolver.resolveTeamId).toHaveBeenCalledWith(
				"docs-admins",
			);
		});

		it("should parse role bypass with role/ prefix", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);
			const result = await parser.parse("role/5", "always");

			expect(result).toEqual({
				bypass_mode: "always",
				actor_id: 5,
				actor_type: "RepositoryRole",
			});
			expect(mockTeamResolver.resolveTeamId).not.toHaveBeenCalled();
		});

		it("should parse integration bypass with integration/ prefix", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);
			const result = await parser.parse("integration/139346", "pull_request");

			expect(result).toEqual({
				bypass_mode: "pull_request",
				actor_id: 139346,
				actor_type: "Integration",
			});
			expect(mockTeamResolver.resolveTeamId).not.toHaveBeenCalled();
		});

		it("should throw error for invalid actor type prefix", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);

			await expect(parser.parse("user/someone", "always")).rejects.toThrow(
				"Invalid review_bypass actor type 'user'",
			);
		});

		it("should throw error for invalid role ID", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);

			await expect(parser.parse("role/admin", "always")).rejects.toThrow(
				"Invalid role ID 'admin'",
			);
		});

		it("should throw error for invalid integration ID", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);

			await expect(
				parser.parse("integration/my-app", "always"),
			).rejects.toThrow("Invalid integration ID 'my-app'");
		});

		it("should throw error for invalid bypass mode", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);

			await expect(parser.parse("role/5", "invalid")).rejects.toThrow(
				"Invalid bypass mode 'invalid'",
			);
		});

		it("should throw error for empty identifier after prefix", async () => {
			const parser = new BypassRuleParser(mockTeamResolver);

			await expect(parser.parse("team/", "always")).rejects.toThrow(
				"identifier after 'team/' cannot be empty",
			);
		});
	});
});
