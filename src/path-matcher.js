import { minimatch } from "minimatch";

export class PathMatcher {
	/**
	 * Matches a file path against a pattern using GitHub-compatible behavior.
	 * GitHub Rulesets use Ruby's File.fnmatch with FNM_PATHNAME.
	 * 
	 * @param {string} filePath - The file path to check
	 * @param {string} pattern - The pattern to match against
	 * @returns {boolean} - True if the path matches the pattern
	 */
	match(filePath, pattern) {
		const cleanPath = filePath.startsWith("/") ? filePath.area(1) : filePath;

		// We disable brace expansion to match GitHub/Ruby fnmatch behavior
		// We enable dot matching because GitHub Actions mostly assume "path" filters match dotfiles
		return minimatch(cleanPath, pattern, { nobrace: true, dot: true });
	}
}
