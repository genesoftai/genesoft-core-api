import { Branding } from "@/modules/project/entity/branding.entity";
import { Feature } from "@/modules/project/entity/feature.entity";
import { Page } from "@/modules/project/entity/page.entity";
import { Project } from "@/modules/project/entity/project.entity";

export function formatBasicInfo(info: Project): string {
    return `
Basic Information
----------------
Project Name: ${info.name}
Description: ${info.description}
Purpose: ${info.purpose}
Target Audience: ${info.target_audience}
----------------
Backend Requirements:
${info.backend_requirements}
`;
}

export function formatFeatures(features: Feature[]): string {
    let formatted = "Features:\n----------------\n";
    for (const feature of features) {
        formatted += `\n- ${feature.name}\n  ${feature.description}\n`;
    }
    return formatted;
}

export function formatPages(pages: Page[]): string {
    let formatted = "Pages:\n----------------\n";
    for (const page of pages) {
        formatted += `\n- ${page.name}\n  ${page.description}\n`;
    }
    return formatted;
}

export function formatBranding(branding: Branding): string {
    return `Branding Guidelines:
    ----------------
Theme: ${branding.theme}
Brand Color: ${branding.color}
Design Perception: ${branding.perception}
Logo URL: ${branding.logo_url}`;
}

export function formatProjectDocumentation(
    basicInfo: Project,
    features: Feature[],
    pages: Page[],
    branding: Branding,
): string {
    return `Project Documentation
Overview of the project follow customer requirements that need to be implemented web application
====================

${formatBasicInfo(basicInfo)}

${formatFeatures(features)}

${formatPages(pages)}

${formatBranding(branding)}`;
}

interface TreeItem {
    path: string;
    type: string;
    size?: number;
}

interface TreeData {
    tree: TreeItem[];
}

function formatGithubRepositoryTreePath(
    path: string,
    type: string,
    size?: number,
): string {
    const sizeStr = size ? ` (${size} bytes)` : "";
    return `- ${path} [${type}]${sizeStr}\n`;
}

export function formatGithubRepositoryTree(treesData: TreeData): string {
    let formatted = "Repository Structure:\n----------------\n";

    const treeItems = treesData.tree.sort((a, b) =>
        a.path.localeCompare(b.path),
    );

    for (const item of treeItems) {
        const pathParts = item.path.split("/");
        const indent = "  ".repeat(pathParts.length - 1);
        formatted += `${indent}${formatGithubRepositoryTreePath(
            pathParts[pathParts.length - 1],
            item.type,
            item.size,
        )}`;
    }

    return formatted;
}

interface IterationInfo {
    id: string;
    project_id: string;
    status: string;
    type: string;
}

interface IterationTask {
    id: string;
    name: string;
    description: string;
    team: string;
    status: string;
    created_at: string;
    updated_at: string;
    iteration: IterationInfo;
}

export function formatIterationTask(task: IterationTask): string {
    return `Iteration Task:
    ----------------
ID: ${task.id}
Name: ${task.name}
Description: ${task.description}
Team: ${task.team}
Status: ${task.status}
Created: ${task.created_at}
Updated: ${task.updated_at}

Iteration Info:
    ID: ${task.iteration.id}
    Project ID: ${task.iteration.project_id}
    Status: ${task.iteration.status}
    Type: ${task.iteration.type}`;
}
