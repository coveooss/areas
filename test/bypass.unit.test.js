import { jest } from "@jest/globals";

// Mocks need to be defined before imports that might use them
const mockGlobSync = jest.fn();
const mockReadFile = jest.fn();

jest.unstable_mockModule("glob", () => ({
	globSync: mockGlobSync,
}));

jest.unstable_mockModule("fs-extra", () => ({
	default: {
		readFile: mockReadFile,
	},
}));

// Dynamic imports
const { ConfigurationReader } = await import("../src/configuration-reader.js");
const { PayloadGenerator } = await import("../src/payload-generator.js");

describe("Bypass Feature", () => {
	describe("ConfigurationReader", () => {
		it("should parse review_bypass and resolve teams", async () => {
			const areasDir = "/tmp/areas";
			const mockResolver = {
				resolveTeamId: jest.fn().mockImplementation(async (slug) => {
					if (slug === "bypass-team") return 999;
					return 0;
				}),
			};

			mockGlobSync.mockReturnValue(["/tmp/areas/bypass.yml"]);
			mockReadFile.mockResolvedValue(`
reviewers: {}
review_bypass:
  bypass-team: pull_request
`);

			const reader = new ConfigurationReader(areasDir, mockResolver);
			const configs = await reader.readConfigurations();

			expect(configs).toHaveLength(1);
			expect(configs[0].review_bypass).toBeDefined();
			expect(configs[0].review_bypass["bypass-team"]).toEqual({
				mode: "pull_request",
				team_id: 999,
			});
			expect(mockResolver.resolveTeamId).toHaveBeenCalledWith("bypass-team");
		});
	});

	describe("PayloadGenerator", () => {
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
					"admin-team": {
					    mode: "always",
					    team_id: 888
					}
				},
				file_patterns: ["*.ts"],
			};

			const payload = generator.generate(config, "coveo/glowing-potato");

			expect(payload.bypass_actors).toBeDefined();
			expect(payload.bypass_actors).toHaveLength(2);
			expect(payload.bypass_actors).toContainEqual({
				actor_id: 999,
				actor_type: "Team",
				bypass_mode: "pull_request",
			});
			expect(payload.bypass_actors).toContainEqual({
                actor_id: 888,
                actor_type: "Team",
                bypass_mode: "always",
            });
		});
	});
});
