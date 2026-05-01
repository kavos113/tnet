import { randomUUID } from 'node:crypto';
import type {
  RequesterVariable,
  RequesterVariableSet
} from '@tnet/app-requester/shared/requesterTypes';
import type { RequesterDatabase } from './requesterDb';

interface VariableSetRow {
  id: string;
  workspace_id: string;
  name: string;
  variables_json?: string;
}

const toVariableSet = (row: VariableSetRow): RequesterVariableSet => ({
  id: row.id,
  workspaceId: row.workspace_id,
  name: row.name
});

export class VariableSetRepository {
  constructor(private readonly database: RequesterDatabase) {}

  list(workspaceId: string): RequesterVariableSet[] {
    const rows = this.database
      .prepare(
        'SELECT id, workspace_id, name FROM variable_sets WHERE workspace_id = ? ORDER BY name ASC'
      )
      .all(workspaceId) as VariableSetRow[];
    return rows.map(toVariableSet);
  }

  save(input: { id?: string; workspaceId: string; name: string }): RequesterVariableSet {
    const now = new Date().toISOString();
    if (input.id) {
      this.database
        .prepare('UPDATE variable_sets SET name = ?, updated_at = ? WHERE id = ?')
        .run(input.name.trim() || 'Variables', now, input.id);
      const updated = this.get(input.id);
      if (!updated) throw new Error(`Variable set not found: ${input.id}`);
      return updated;
    }

    const variableSet = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      name: input.name.trim() || 'Variables'
    };
    this.database
      .prepare(
        `INSERT INTO variable_sets (
           id, workspace_id, name, variables_json, secret_refs_json, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        variableSet.id,
        variableSet.workspaceId,
        variableSet.name,
        JSON.stringify([]),
        JSON.stringify([]),
        now,
        now
      );
    return variableSet;
  }

  remove(variableSetId: string): void {
    this.database.prepare('DELETE FROM variable_sets WHERE id = ?').run(variableSetId);
  }

  listVariables(variableSetId: string): RequesterVariable[] {
    const row = this.database
      .prepare('SELECT variables_json FROM variable_sets WHERE id = ?')
      .get(variableSetId) as { variables_json: string } | undefined;
    if (!row) return [];
    return parseVariables(row.variables_json);
  }

  upsertVariables(variableSetId: string, variables: Array<{ key: string; value: string }>): void {
    const existing = new Map(
      this.listVariables(variableSetId).map((variable) => [variable.key, variable])
    );
    const now = new Date().toISOString();

    for (const variable of variables) {
      const key = variable.key.trim();
      if (!key) continue;
      existing.set(key, {
        key,
        value: variable.value,
        updatedAt: now
      });
    }

    this.database
      .prepare('UPDATE variable_sets SET variables_json = ?, updated_at = ? WHERE id = ?')
      .run(
        JSON.stringify(
          [...existing.values()].sort((left, right) => left.key.localeCompare(right.key))
        ),
        now,
        variableSetId
      );
  }

  private get(variableSetId: string): RequesterVariableSet | null {
    const row = this.database
      .prepare('SELECT id, workspace_id, name FROM variable_sets WHERE id = ?')
      .get(variableSetId) as VariableSetRow | undefined;
    return row ? toVariableSet(row) : null;
  }
}

const parseVariables = (json: string): RequesterVariable[] => {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed)) return [];

  return parsed.flatMap((item): RequesterVariable[] => {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('key' in item) ||
      !('value' in item) ||
      typeof item.key !== 'string' ||
      typeof item.value !== 'string'
    ) {
      return [];
    }

    return [
      {
        key: item.key,
        value: item.value,
        updatedAt:
          'updatedAt' in item && typeof item.updatedAt === 'string'
            ? item.updatedAt
            : new Date(0).toISOString()
      }
    ];
  });
};
