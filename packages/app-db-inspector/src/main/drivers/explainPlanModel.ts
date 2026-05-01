import type { ExplainPlanNode } from '@tnet/app-db-inspector/shared/dbInspectorTypes';

export interface SqliteExplainPlanRow {
  id: number;
  parent: number;
  detail: string;
}

export const sqliteExplainRowsToNodes = (rows: SqliteExplainPlanRow[]): ExplainPlanNode[] => {
  const nodes = new Map<number, ExplainPlanNode>();
  rows.forEach((row) => {
    nodes.set(row.id, {
      id: String(row.id),
      label: row.detail,
      detail: `parent: ${row.parent}`,
      children: []
    });
  });

  const roots: ExplainPlanNode[] = [];
  rows.forEach((row) => {
    const node = nodes.get(row.id);
    if (!node) return;
    const parent = nodes.get(row.parent);
    if (parent && parent !== node) {
      parent.children = [...(parent.children ?? []), node];
    } else {
      roots.push(node);
    }
  });
  return roots;
};

export const postgresJsonPlanToNodes = (plan: unknown): ExplainPlanNode[] => {
  const root = Array.isArray(plan) ? plan[0] : plan;
  const planRoot = isRecord(root) && 'Plan' in root ? root.Plan : root;
  const node = postgresPlanObjectToNode(planRoot, '0');
  return node ? [node] : [];
};

export const mysqlJsonPlanToNodes = (plan: unknown): ExplainPlanNode[] => {
  const node = mysqlPlanObjectToNode(plan, '0', 'query_block');
  return node ? [node] : [];
};

const postgresPlanObjectToNode = (value: unknown, id: string): ExplainPlanNode | undefined => {
  if (!isRecord(value)) return undefined;
  const children = Array.isArray(value.Plans)
    ? value.Plans.map((child, index) => postgresPlanObjectToNode(child, `${id}.${index}`)).filter(
        (child): child is ExplainPlanNode => Boolean(child)
      )
    : [];
  const nodeType = stringValue(value['Node Type']) ?? 'Plan';
  const relation = stringValue(value['Relation Name']);
  return {
    id,
    label: relation ? `${nodeType} on ${relation}` : nodeType,
    cost:
      value['Total Cost'] === undefined
        ? undefined
        : `${stringValue(value['Startup Cost']) ?? '?'}..${stringValue(value['Total Cost'])}`,
    rows: stringValue(value['Plan Rows']),
    children
  };
};

const mysqlPlanObjectToNode = (
  value: unknown,
  id: string,
  fallbackLabel: string
): ExplainPlanNode | undefined => {
  if (!isRecord(value)) return undefined;
  const children: ExplainPlanNode[] = [];
  Object.entries(value).forEach(([key, childValue], index) => {
    if (isRecord(childValue)) {
      const child = mysqlPlanObjectToNode(childValue, `${id}.${index}`, key);
      if (child) children.push(child);
    } else if (Array.isArray(childValue)) {
      childValue.forEach((arrayChild, arrayIndex) => {
        const child = mysqlPlanObjectToNode(arrayChild, `${id}.${index}.${arrayIndex}`, key);
        if (child) children.push(child);
      });
    }
  });
  const tableName =
    isRecord(value.table) && typeof value.table.table_name === 'string'
      ? value.table.table_name
      : undefined;
  const accessType =
    isRecord(value.table) && typeof value.table.access_type === 'string'
      ? value.table.access_type
      : undefined;
  return {
    id,
    label: tableName ? `${fallbackLabel}: ${tableName}` : fallbackLabel,
    detail: accessType ? `access: ${accessType}` : undefined,
    cost: isRecord(value.cost_info) ? stringValue(value.cost_info.query_cost) : undefined,
    rows: isRecord(value.table) ? stringValue(value.table.rows_examined_per_scan) : undefined,
    children
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const stringValue = (value: unknown): string | undefined =>
  value === undefined || value === null ? undefined : String(value);
