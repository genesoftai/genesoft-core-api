export function formatGithubRepositoryTreePath(name: string): string {
    return `- ${name} \n`;
}

/**
 * Format GitHub repository tree structure into a readable string
 * @param treesData - Array of tree items with path and name properties
 * @returns Formatted string representation of the repository structure
 */
export function formatGithubRepositoryTreeFromSandbox(
    treesData: Array<{ path: string; name: string; type?: string }>,
): string {
    let formatted = "Repository Structure:\n----------------\n";

    // Sort tree items by path
    const treeItems = [...treesData].sort((a, b) =>
        a.path.localeCompare(b.path),
    );

    for (const item of treeItems) {
        const path = item.path;
        const name = item.name;

        // Calculate directory depth for indentation
        // Remove leading slash before splitting
        const pathParts = path.replace(/^\//, "").split("/");
        const indent = "  ".repeat(pathParts.length - 1);

        // Add the formatted path with proper indentation
        formatted += `${indent}${formatGithubRepositoryTreePath(name)}\n`;
    }

    return formatted;
}
