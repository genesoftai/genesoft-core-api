export interface DatabaseColumn {
    table_name: string;
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
    constraint_type: string | null;
    referenced_table: string | null;
    referenced_column: string | null;
}

export interface DatabaseRelation {
    source_table: string;
    source_column: string;
    target_table: string;
    target_column: string;
    constraint_type: string;
}

export interface DatabaseSchema {
    schema: DatabaseColumn[];
    relations: DatabaseRelation[] | null;
}

export interface DatabaseSchemas {
    public: DatabaseSchema;
    auth: DatabaseSchema;
}

export function getDbStructureString(result: DatabaseSchemas): string {
    const schemas = ["public", "auth"] as const;
    const structureLines: string[] = [];

    schemas.forEach((schemaName) => {
        const schema = result[schemaName];

        // Group columns by table
        const tableMap = new Map<string, DatabaseColumn[]>();
        schema.schema.forEach((col) => {
            if (!tableMap.has(col.table_name)) {
                tableMap.set(col.table_name, []);
            }
            tableMap.get(col.table_name)?.push(col);
        });

        structureLines.push(`Schema: ${schemaName}`);
        structureLines.push("");

        tableMap.forEach((columns, tableName) => {
            // Remove duplicate columns (keeping first occurrence)
            const uniqueColumns = columns.filter(
                (col, index, self) =>
                    index ===
                    self.findIndex((c) => c.column_name === col.column_name),
            );

            structureLines.push(`Table: ${tableName}`);
            structureLines.push("Columns:");

            uniqueColumns.forEach((col) => {
                let columnDesc = `  - ${col.column_name} (${col.data_type})`;

                const constraints: string[] = [];

                if (col.is_nullable === "NO") {
                    constraints.push("required");
                }

                if (col.column_default !== null) {
                    constraints.push(`default: ${col.column_default}`);
                }

                if (col.constraint_type === "PRIMARY KEY") {
                    constraints.push("primary key");
                }

                if (col.constraint_type === "UNIQUE") {
                    constraints.push("unique");
                }

                if (col.constraint_type === "FOREIGN KEY") {
                    constraints.push(
                        `references ${col.referenced_table}.${col.referenced_column}`,
                    );
                }

                if (constraints.length > 0) {
                    columnDesc += ` [${constraints.join(", ")}]`;
                }

                structureLines.push(columnDesc);
            });

            // Add relations for this table if they exist
            if (schema.relations) {
                const tableRelations = schema.relations.filter(
                    (rel) => rel.source_table === tableName,
                );

                if (tableRelations.length > 0) {
                    structureLines.push("Relations:");
                    tableRelations.forEach((rel) => {
                        structureLines.push(
                            `  - ${rel.source_column} -> ${rel.target_table}.${rel.target_column}`,
                        );
                    });
                }
            }

            structureLines.push(""); // Empty line between tables
        });

        structureLines.push(""); // Empty line between schemas
    });

    return structureLines.join("\n");
}
