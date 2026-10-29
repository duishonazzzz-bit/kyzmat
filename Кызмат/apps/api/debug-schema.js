const fs = require('fs');
const { Pool } = require('pg');

function splitSqlStatements(rawSql) {
  const statements = [];
  let current = '';
  let quote = null;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  for (let index = 0; index < rawSql.length; index += 1) {
    const ch = rawSql[index];
    const next = rawSql[index + 1] || '';

    if (inLineComment) {
      current += ch;
      if (ch === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      current += ch;
      if (ch === '*' && next === '/') {
        current += next;
        index += 1;
        inBlockComment = false;
      }
      continue;
    }

    if (dollarTag) {
      const endIndex = rawSql.indexOf(dollarTag, index);
      if (endIndex === -1) {
        current += rawSql.slice(index);
        break;
      }
      current += rawSql.slice(index, endIndex + dollarTag.length);
      index = endIndex + dollarTag.length - 1;
      dollarTag = null;
      continue;
    }

    if (quote) {
      current += ch;
      if (ch === quote && rawSql[index - 1] !== '\\') quote = null;
      continue;
    }

    if (ch === '-' && next === '-') {
      current += ch;
      inLineComment = true;
      continue;
    }

    if (ch === '/' && next === '*') {
      current += ch;
      inBlockComment = true;
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '$') {
      const match = rawSql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/);
      if (match) {
        dollarTag = match[0];
        current += match[0];
        index += match[0].length - 1;
        continue;
      }
    }

    if (ch === ';') {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      continue;
    }

    current += ch;
  }

  const final = current.trim();
  if (final) statements.push(final);
  return statements;
}

(async () => {
  const sql = fs.readFileSync('sql/001_init.sql', 'utf8');
  const statements = splitSqlStatements(sql);
  console.log('total statements', statements.length);
  const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/kyzmat' });

  for (let i = 0; i < statements.length; i += 1) {
    const statement = statements[i];
    try {
      await pool.query(statement);
      console.log('OK', i + 1, statement.slice(0, 50).replace(/\n/g, ' '));
    } catch (error) {
      console.error('FAILED at', i + 1, error.message);
      console.error(statement.slice(0, 500));
      process.exit(1);
    }
  }

  await pool.end();
})();
