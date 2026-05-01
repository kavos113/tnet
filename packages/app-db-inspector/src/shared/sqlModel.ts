export const isMutatingSql = (sqlText: string): boolean => {
  const normalized = sqlText
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  const firstToken = normalized.match(/^[a-z]+/i)?.[0].toLowerCase();
  return Boolean(
    firstToken &&
    ['alter', 'create', 'delete', 'drop', 'insert', 'replace', 'truncate', 'update'].includes(
      firstToken
    )
  );
};

export const assertSingleStatement = (sqlText: string): void => {
  const withoutTrailingSemicolon = sqlText.trim().replace(/;\s*$/, '');
  if (withoutTrailingSemicolon.includes(';')) {
    throw new Error('Only one SQL statement can be executed at a time.');
  }
};
