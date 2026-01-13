import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PathMatcher } from './path-matcher';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TestCase {
  description: string;
  pattern: string;
  path: string;
  match: boolean;
}

describe('Path Matcher', () => {
  const fixturesPath = path.join(__dirname, 'path_matcher_fixtures.json');
  const fixtures: TestCase[] = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

  const pathMatcher = new PathMatcher();

  fixtures.forEach((testCase) => {
    const { description, pattern, path: filePath, match: shouldMatch } = testCase;
    const testName = `${description}: '${pattern}' should ${shouldMatch ? 'match' : 'NOT match'} '${filePath}'`;

    it(testName, () => {
      const result = pathMatcher.match(filePath, pattern);

      expect(result).toBe(shouldMatch);
    });
  });
});
