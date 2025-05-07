/**
 * Recursively extracts all children from a Figma document structure
 * @param nodes - Array of Figma nodes to process
 * @returns Array of extracted nodes with their hierarchical structure preserved
 */
export function extractFigmaChildren(nodes: any[]): any[] {
    if (!nodes || !Array.isArray(nodes)) {
        return [];
    }

    return nodes.map((node) => {
        // Create a base object with essential properties
        const extractedNode: any = {
            id: node.id,
            type: node.type,
            name: node.name,
            children: node.children ? extractFigmaChildren(node.children) : [],
        };

        return extractedNode;
    });
}
/**
 * Extracts only CANVAS nodes at the top level and FRAME nodes at the second level
 * @param nodes - Array of Figma nodes to process
 * @returns Array of extracted CANVAS nodes with only FRAME children
 */
export function extractFigmaCanvasAndFrame(nodes: any[]): any[] {
    if (!nodes || !Array.isArray(nodes)) {
        return [];
    }

    return nodes
        .filter((node) => node.type === "CANVAS")
        .map((canvas) => {
            // Extract only the canvas node
            const extractedCanvas: any = {
                id: canvas.id,
                type: canvas.type,
                name: canvas.name,
                children: [],
            };

            // Filter only FRAME children
            if (canvas.children && Array.isArray(canvas.children)) {
                extractedCanvas.children = canvas.children
                    .filter((child) => child.type === "FRAME")
                    .map((frame) => ({
                        id: frame.id,
                        type: frame.type,
                        name: frame.name,
                        children: [],
                    }));
            }

            return extractedCanvas;
        });
}

/**
 * Converts a hierarchical Figma document structure to a formatted string representation
 * Only includes Canvas (level 1) and FRAME nodes (level 2)
 * @param nodes - Array of Figma nodes to format
 * @param indentLevel - Current indentation level (used for recursion)
 * @returns Formatted string representation of the Figma document structure
 */
export function formatFigmaHierarchy(
    nodes: any[],
    indentLevel: number = 0,
): string {
    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
        return "";
    }

    let result = "";

    for (const node of nodes) {
        // Only process Canvas nodes at level 0
        if (indentLevel === 0 && node.type === "CANVAS") {
            result += `${node.name} (${node.type}) [${node.id}]\n`;

            // Only process FRAME nodes at level 1
            if (node.children && node.children.length > 0) {
                for (const childNode of node.children) {
                    if (childNode.type === "FRAME") {
                        const indent = "  ";
                        result += `${indent}- ${childNode.name} (${childNode.type}) [${childNode.id}]\n`;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Converts a Figma document structure to a human-readable string representation
 * showing the hierarchical relationship between elements
 * @param nodes - Array of Figma nodes to format
 * @returns String representation of the Figma document structure
 */
export function figmaStructureToString(nodes: any[]): string {
    return formatFigmaHierarchy(nodes);
}
