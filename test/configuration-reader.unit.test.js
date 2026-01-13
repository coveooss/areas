import { jest } from "@jest/globals";

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

const { ConfigurationReader } = await import("../src/configuration-reader.js");

describe("ConfigurationReader", () => {
	it("should read configurations and resolve teams", async () => {
		const areasDir = "/tmp/areas";
		const mockResolver = {
			resolveTeamId: jest.fn().mockResolvedValue(123),
		};

		mockGlobSync.mockReturnValue(["/tmp/areas/area1.yml"]);
		mockReadFile.mockResolvedValue("reviewers:\n  my-team:\n    minimum_approvals: 1\n");

		const reader = new ConfigurationReader(areasDir, mockResolver);
		const configs = await reader.readConfigurations();

		expect(configs).toHaveLength(1);
		expect(configs[0].reviewers["my-team"].team_id).toBe(123);
		expect(configs[0].reviewers["my-team"].minimum_approvals).toBe(1);
		expect(mockResolver.resolveTeamId).toHaveBeenCalledWith("my-team");
		expect(configs[0].name).toBe("area1");
		expect(mockGlobSync).toHaveBeenCalledWith(`${areasDir}/*.{yml,yaml}`);
	});

	it("should handle nil configuration with default minimum_approvals: 0", async () => {
		const areasDir = "/tmp/areas";
		const mockResolver = {
			resolveTeamId: jest.fn().mockResolvedValue(456),
		};

		mockGlobSync.mockReturnValue(["/tmp/areas/area2.yml"]);
		mockReadFile.mockResolvedValue("reviewers:\n  other-team: ~\n");

		const reader = new ConfigurationReader(areasDir, mockResolver);
		const configs = await reader.readConfigurations();

		expect(configs).toHaveLength(1);
		expect(configs[0].reviewers["other-team"].team_id).toBe(456);
		expect(configs[0].reviewers["other-team"].minimum_approvals).toBe(0);
		expect(mockResolver.resolveTeamId).toHaveBeenCalledWith("other-team");
	});
});
