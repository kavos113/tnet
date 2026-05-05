export type JsonFormatResult = { ok: true; value: string } | { ok: false; error: string };

export const formatJsonText = (value: string): JsonFormatResult => {
  try {
    return { ok: true, value: JSON.stringify(JSON.parse(value), null, 2) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Invalid JSON.'
    };
  }
};
