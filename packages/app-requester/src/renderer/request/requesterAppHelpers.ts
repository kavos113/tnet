import type {
  RequesterExecutionErrorSnapshot,
  RequesterKeyValueRow
} from '@tnet/app-requester/shared/requesterTypes';

export interface GraphqlSchemaTypeSummary {
  name: string;
  kind: string;
  fieldCount: number;
}

export const createEmptyRow = (): RequesterKeyValueRow => ({
  id: crypto.randomUUID(),
  enabled: true,
  key: '',
  value: ''
});

export const updateKeyValueRow = (
  rows: RequesterKeyValueRow[],
  rowId: string,
  patch: Partial<RequesterKeyValueRow>
): RequesterKeyValueRow[] => rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row));

export const stringifyErrorValue = (value: unknown): string | undefined => {
  if (value === undefined || value === null) return undefined;
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export const toExecutionErrorSnapshot = (error: unknown): RequesterExecutionErrorSnapshot => {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Request execution failed.',
      stack: error.stack,
      cause: stringifyErrorValue(error.cause)
    };
  }

  return {
    name: 'Error',
    message: stringifyErrorValue(error) ?? 'Request execution failed.'
  };
};

export const buildGraphqlSchemaSummary = (schemaJson: string): GraphqlSchemaTypeSummary[] => {
  const parsed: unknown = JSON.parse(schemaJson);
  if (!isRecord(parsed) || !isRecord(parsed.data) || !isRecord(parsed.data.__schema)) {
    return [];
  }

  const types = parsed.data.__schema.types;
  if (!Array.isArray(types)) return [];

  return types
    .flatMap((type): GraphqlSchemaTypeSummary[] => {
      if (!isRecord(type) || typeof type.name !== 'string' || typeof type.kind !== 'string') {
        return [];
      }
      if (type.name.startsWith('__')) return [];

      const fields = Array.isArray(type.fields)
        ? type.fields
        : Array.isArray(type.inputFields)
          ? type.inputFields
          : Array.isArray(type.enumValues)
            ? type.enumValues
            : [];

      return [
        {
          name: type.name,
          kind: type.kind,
          fieldCount: fields.length
        }
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name))
    .slice(0, 48);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
