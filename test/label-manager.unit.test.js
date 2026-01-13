import { jest } from '@jest/globals';

// Mock PathMatcher before importing LabelManager
const mockMatch = jest.fn();
// We mock the class so that:
// 1. new PathMatcher() works returns an object
// 2. PathMatcher.match works (if static usage is intended) OR instance.match works
jest.unstable_mockModule('../src/path-matcher.js', () => ({
    PathMatcher: class {
        constructor() {}
        match(file, pattern) { return mockMatch(file, pattern); }
        // static match removed to reflect reality
    }
}));

const { LabelManager } = await import('../src/label-manager.js');

describe('LabelManager', () => {
    let mockOctokit;
    let labelManager;
    let consoleLogSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        mockOctokit = {
            paginate: jest.fn(),
            rest: {
                pulls: { listFiles: jest.fn() },
                issues: {
                    listLabelsOnIssue: jest.fn(),
                    addLabels: jest.fn(),
                    removeLabel: jest.fn()
                }
            }
        };
        labelManager = new LabelManager(mockOctokit, 'owner', 'repo');
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('processPR', () => {
        it('should add area and team labels when patterns match', async () => {
            // Arrange
            const prNumber = 123;
            const configs = [{
                name: 'test-area',
                file_patterns: ['*.ts'],
                reviewers: { 'some-team': {} }
            }];

            // Mock changed files
            mockOctokit.paginate.mockResolvedValue(['file.ts']);

            // Mock PathMatcher to match
            mockMatch.mockReturnValue(true);

            // Mock current labels (empty)
            mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ data: [] });

            // Act
            await labelManager.processPR(prNumber, configs);

            // Assert
            // 1. Check getChangedFiles was called
            expect(mockOctokit.paginate).toHaveBeenCalledWith(
                mockOctokit.rest.pulls.listFiles,
                expect.objectContaining({ pull_number: prNumber }),
                expect.any(Function)
            );

            // 2. Check labels were added
            const expectedLabelsToAdd = ['area:test-area', 'team:some-team'];
            expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({
                issue_number: prNumber,
                labels: expectedLabelsToAdd // Note: Sets order depends on iteration, array check might need to be loose
            }));
            
            // Verify removeLabel was NOT called
            expect(mockOctokit.rest.issues.removeLabel).not.toHaveBeenCalled();
        });

        it('should remove labels when area no longer matches', async () => {
            // Arrange
            const prNumber = 123;
            // Config has pattern that won't match
            const configs = [{
                name: 'test-area',
                file_patterns: ['*.ts']
            }];

            mockOctokit.paginate.mockResolvedValue(['file.js']); // .js doesn't match .ts
            mockMatch.mockReturnValue(false);

            // Current labels has the area label
            mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ 
                data: [{ name: 'area:test-area' }] 
            });

            // Act
            await labelManager.processPR(prNumber, configs);

            // Assert
            expect(mockOctokit.rest.issues.addLabels).not.toHaveBeenCalled();
            expect(mockOctokit.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
                issue_number: prNumber,
                name: 'area:test-area'
            }));
        });

        it('should do nothing when labels are already synced', async () => {
            // Arrange
            const prNumber = 123;
            const configs = [{
                name: 'test-area',
                file_patterns: ['*.ts']
            }];

            mockOctokit.paginate.mockResolvedValue(['file.ts']);
            mockMatch.mockReturnValue(true);

            // Current labels already matches desired
            mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ 
                data: [{ name: 'area:test-area' }] 
            });

            // Act
            await labelManager.processPR(prNumber, configs);

            // Assert
            expect(mockOctokit.rest.issues.addLabels).not.toHaveBeenCalled();
            expect(mockOctokit.rest.issues.removeLabel).not.toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith("No label changes needed.");
        });

        it('should handle removing one label and adding another', async () => {
            // Arrange
            const prNumber = 123;
            const configs = [{
                name: 'new-area',
                file_patterns: ['*.ts']
            }]; // old-area is missing from configs or doesn't match

            mockOctokit.paginate.mockResolvedValue(['file.ts']);
            mockMatch.mockReturnValue(true);

            // Current has 'area:old-area'
            mockOctokit.rest.issues.listLabelsOnIssue.mockResolvedValue({ 
                data: [{ name: 'area:old-area' }] 
            });

            // Act
            await labelManager.processPR(prNumber, configs);

            // Assert
            // Should add 'area:new-area'
            expect(mockOctokit.rest.issues.addLabels).toHaveBeenCalledWith(expect.objectContaining({
                labels: ['area:new-area']
            }));
            
            // Should remove 'area:old-area' (because it starts with area: and is not in desired)
            expect(mockOctokit.rest.issues.removeLabel).toHaveBeenCalledWith(expect.objectContaining({
                name: 'area:old-area'
            }));
        });
    });
});
