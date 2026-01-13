import { PathMatcher } from '../src/path-matcher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Path Matcher', () => {
    const fixturesPath = path.join(__dirname, 'path_matcher_fixtures.json');
    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));

    // Instantiate PathMatcher with a dummy root
    const pathMatcher = new PathMatcher();

    fixtures.forEach((testCase) => {
        const { description, pattern, path: filePath, match: shouldMatch } = testCase;
        const testName = `${description}: '${pattern}' should ${shouldMatch ? 'match' : 'NOT match'} '${filePath}'`;

        it(testName, () => {
             // GitHub Rulesets behave like Ruby's File.fnmatch with FNM_PATHNAME.
             // Minimatch is mostly compatible but let's verify.
             // Some specific options might be needed if defaults differ, but let's try default first.
            const result = pathMatcher.match(filePath, pattern);
            
            if (shouldMatch) {
                expect(result).toBe(true);
            } else {
                expect(result).toBe(false);
            }
        });
    });
});
