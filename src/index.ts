import * as core from '@actions/core';
import * as github from '@actions/github';

async function run(): Promise<void> {
  try {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    core.info(`Action started for event: ${context.eventName}`);

    // Placeholder for logic
    core.info('This is the Areas Action.');

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run();
