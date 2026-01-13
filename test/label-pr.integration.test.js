import path from "node:path";
import { fileURLToPath } from "node:url";
import { getOctokit } from "@actions/github";
import { ConfigurationReader } from "../src/configuration-reader.js";
import { LabelManager } from "../src/label-manager.js";
import { TeamResolver } from "../src/team-resolver.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.GITHUB_TOKEN;
const owner = process.env.OWNER || "coveo";
const repo = process.env.REPO || "glowing-potato";
const prNumber = process.env.PR_NUMBER ? Number.parseInt(process.env.PR_NUMBER) : undefined;

const describeIntegration = token && prNumber ? describe : describe.skip;

describeIntegration("Label PR Integration Test", () => {
    let octokit;

    beforeAll(() => {
        if (!token) {
            return;
        }

        octokit = getOctokit(token);
    });

    it("should process PR and update labels", async () => {
        const teamResolver = new TeamResolver(octokit, owner);
        const labelManager = new LabelManager(octokit, owner, repo);

        const areasDir = path.resolve(__dirname, "../../../../.areas");
        console.log(`Reading configurations from ${areasDir}`);

        const configReader = new ConfigurationReader(areasDir, teamResolver);
        const configs = await configReader.readConfigurations();

        console.log(`Processing PR #${prNumber}`);
        await labelManager.processPR(prNumber, configs);
    });
});
