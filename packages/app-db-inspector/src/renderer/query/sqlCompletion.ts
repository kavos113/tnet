import type { Completion, CompletionContext, CompletionSource } from '@codemirror/autocomplete';
import type {
  DatabaseSchemaSnapshot,
  DbInspectorDriverType
} from '@tnet/app-db-inspector/shared/dbInspectorTypes';
import {
  buildSqlCompletionItems,
  getSqlCompletionContext
} from '@tnet/app-db-inspector/shared/sqlCompletionModel';

export const createSqlCompletionSource =
  ({
    dialect,
    schema
  }: {
    dialect: DbInspectorDriverType;
    schema?: DatabaseSchemaSnapshot;
  }): CompletionSource =>
  (context: CompletionContext) => {
    const sqlText = context.state.doc.toString();
    const completionContext = getSqlCompletionContext(sqlText, context.pos);
    if (!context.explicit && completionContext.prefix.length === 0) return null;

    const options: Completion[] = buildSqlCompletionItems({
      context: completionContext,
      dialect,
      schema
    }).map((item) => ({
      label: item.label,
      apply: item.apply,
      type: item.kind === 'keyword' ? 'keyword' : item.kind,
      detail: item.detail
    }));

    if (options.length === 0) return null;
    return {
      from: completionContext.from,
      options,
      validFor: /^[A-Za-z0-9_]*$/
    };
  };
