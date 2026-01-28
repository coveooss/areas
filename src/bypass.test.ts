import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock modules
vi.mock("glob", () => ({
	globSync: vi.fn(),
}));

vi.mock("fs-extra", () => ({
	default: {
		readFile: vi.fn(),
	},
}));

import fs from "fs-extra";
import { globSync } from "glob";
import { ConfigurationReader } from "./configuration-reader";
import { PayloadGenerator } from "./payload-generator";

describe("Bypass Feature", () => {
	const mockGlobSync = vi.mocked(globSync);
	const mockReadFile = vi.mocked(fs.readFile);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("ConfigurationReader", () => {
		it("should parse team bypass with team/ prefix", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn().mockImplementation(async (slug: string) => {
					if (slug === "bypass-team") return 999;
					return 0;
				}),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  team/bypass-team: pull_request
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);
			const configs = await reader.readConfigurations();

			expect(configs).toHaveLength(1);
			expect(configs[0].review_bypass).toBeDefined();
			expect(configs[0].review_bypass).toEqual([
				{
					bypass_mode: "pull_request",
					actor_id: 999,
					actor_type: "Team",
				},
			]);
			expect(mockResolver.resolveTeamId).toHaveBeenCalledWith("bypass-team");
		});

		it("should default to team when no prefix is provided", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn().mockResolvedValue(999),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  docs-admins: always
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);
			const configs = await reader.readConfigurations();

			expect(configs).toHaveLength(1);
			expect(configs[0].review_bypass).toEqual([
				{
					bypass_mode: "always",
					actor_id: 999,
					actor_type: "Team",
				},
			]);
			expect(mockResolver.resolveTeamId).toHaveBeenCalledWith("docs-admins");
		});

		it("should parse role bypass with role/ prefix", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn(),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  role/5: always
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);
			const configs = await reader.readConfigurations();

			expect(configs).toHaveLength(1);
			expect(configs[0].review_bypass).toEqual([
				{
					bypass_mode: "always",
					actor_id: 5,
					actor_type: "RepositoryRole",
				},
			]);
		});

		it("should parse integration bypass with integration/ prefix", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn(),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  integration/139346: always
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);
			const configs = await reader.readConfigurations();

			expect(configs).toHaveLength(1);
			expect(configs[0].review_bypass).toEqual([
				{
					bypass_mode: "always",
					actor_id: 139346,
					actor_type: "Integration",
				},
			]);
		});

		it("should support multiple bypass actors of different types", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn().mockResolvedValue(999),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  team/docs-admins: always
  other-team: always
  role/5: always
  integration/139346: pull_request
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);
			const configs = await reader.readConfigurations();

			expect(configs).toHaveLength(1);
			expect(configs[0].review_bypass).toHaveLength(4);
			expect(configs[0].review_bypass).toEqual([
				{ bypass_mode: "always", actor_id: 999, actor_type: "Team" },
				{ bypass_mode: "always", actor_id: 999, actor_type: "Team" },
				{ bypass_mode: "always", actor_id: 5, actor_type: "RepositoryRole" },
				{
					bypass_mode: "pull_request",
					actor_id: 139346,
					actor_type: "Integration",
				},
			]);
		});

		it("should throw error for invalid actor type prefix", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn(),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  user/someone: always
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);

			await expect(reader.readConfigurations()).rejects.toThrow(
				"Invalid review_bypass actor type 'user'",
			);
		});

		it("should throw error for invalid role ID", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn(),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  role/admin: always
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);

			await expect(reader.readConfigurations()).rejects.toThrow(
				"Invalid role ID 'admin'",
			);
		});

		it("should throw error for invalid integration ID", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: vi.fn(),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"] as any);
			mockReadFile.mockResolvedValue(
				`
reviewers: {}
review_bypass:
  integration/my-app: always
` as any,
			);

			const reader = new ConfigurationReader(areasDir, mockResolver);

			await expect(reader.readConfigurations()).rejects.toThrow(
				"Invalid integration ID 'my-app'",
			);
		});
	});

	describe("PayloadGenerator", () => {
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

		it("should generate empty bypass_actors when no bypass configured", () => {
			const generator = new PayloadGenerator();
			const config = {
				name: "no-bypass-area",
				reviewers: {},
				file_patterns: ["*.js"],
			};

			const payload = generator.generate(config, "coveo/test");

			expect(payload.bypass_actors).toHaveLength(0);
		});
	});
});
