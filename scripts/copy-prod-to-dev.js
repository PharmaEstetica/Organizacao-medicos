/**
 * copy-prod-to-dev.js
 *
 * Copia todos os dados do banco de Produção para o banco de Desenvolvimento.
 * Execução: node scripts/copy-prod-to-dev.js
 *
 * Variáveis de ambiente necessárias:
 *   PROD_DATABASE_URL  — string de conexão do banco de Produção
 *   DATABASE_URL       — string de conexão do banco de Desenvolvimento (já configurada)
 *
 * Para obter PROD_DATABASE_URL:
 *   1. Abra o painel do Replit → aba "Deployments" → clique no deploy publicado
 *   2. Acesse as configurações do banco de produção e copie a connection string
 *   3. Adicione como secret PROD_DATABASE_URL neste Repl antes de rodar o script
 */

import pg from "pg";

const { Pool } = pg;

const PROD_URL = process.env.PROD_DATABASE_URL;
const DEV_URL = process.env.DATABASE_URL;

if (!PROD_URL) {
  console.error("❌  PROD_DATABASE_URL não está definida.");
  console.error(
    "   Adicione a connection string do banco de produção como secret PROD_DATABASE_URL e tente novamente."
  );
  process.exit(1);
}

if (!DEV_URL) {
  console.error("❌  DATABASE_URL não está definida.");
  process.exit(1);
}

if (PROD_URL === DEV_URL) {
  console.error(
    "❌  PROD_DATABASE_URL e DATABASE_URL apontam para o mesmo banco. Abortando para proteger os dados."
  );
  process.exit(1);
}

const prod = new Pool({ connectionString: PROD_URL, ssl: { rejectUnauthorized: false } });
const dev = new Pool({ connectionString: DEV_URL, ssl: { rejectUnauthorized: false } });

async function getTables(client) {
  const res = await client.query(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  return res.rows.map((r) => r.tablename);
}

async function getColumnMeta(client, table) {
  const res = await client.query(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
  `, [table]);
  return res.rows.map((r) => ({
    name: r.column_name,
    isJson: r.data_type === "json" || r.data_type === "jsonb" || r.udt_name === "json" || r.udt_name === "jsonb",
  }));
}

function sanitizeValue(value, isJson) {
  if (!isJson) return value;
  if (value === null || value === undefined) return null;
  // pg driver already parses jsonb columns into objects — pass through as-is
  if (typeof value === "object") return value;
  // value is a raw string — validate it
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "null") return null;
    try {
      JSON.parse(trimmed);
      return value; // valid JSON string, let pg handle it
    } catch {
      return null; // invalid JSON — convert to NULL
    }
  }
  return value;
}

async function copyTable(prodClient, devClient, table) {
  const colMeta = await getColumnMeta(prodClient, table);
  if (colMeta.length === 0) {
    console.log(`  ⚠️  ${table}: sem colunas, ignorada.`);
    return 0;
  }

  const cols = colMeta.map((c) => c.name);
  const { rows } = await prodClient.query(`SELECT * FROM "${table}"`);

  await devClient.query(`TRUNCATE TABLE "${table}" CASCADE`);

  if (rows.length === 0) {
    return 0;
  }

  const BATCH = 500;
  const quotedCols = cols.map((c) => `"${c}"`).join(", ");

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const valuePlaceholders = batch
      .map(
        (_, rowIdx) =>
          `(${cols.map((_, colIdx) => `$${rowIdx * cols.length + colIdx + 1}`).join(", ")})`
      )
      .join(", ");

    const flatValues = batch.flatMap((row) =>
      colMeta.map((col) => sanitizeValue(row[col.name], col.isJson))
    );

    await devClient.query(
      `INSERT INTO "${table}" (${quotedCols}) VALUES ${valuePlaceholders}`,
      flatValues
    );
  }

  return rows.length;
}

async function main() {
  console.log("🚀  Iniciando cópia: Produção → Desenvolvimento\n");

  let prodClient, devClient;

  try {
    prodClient = await prod.connect();
    devClient = await dev.connect();

    console.log("✅  Conectado ao banco de Produção");
    console.log("✅  Conectado ao banco de Desenvolvimento\n");

    const tables = await getTables(prodClient);
    console.log(`📋  ${tables.length} tabela(s) encontrada(s): ${tables.join(", ")}\n`);

    await devClient.query("SET session_replication_role = 'replica'");

    let totalRecords = 0;
    let totalTables = 0;

    for (const table of tables) {
      process.stdout.write(`  📄  ${table} ... `);
      try {
        const count = await copyTable(prodClient, devClient, table);
        console.log(`${count} registro(s)`);
        totalRecords += count;
        totalTables++;
      } catch (err) {
        console.log(`❌ ERRO: ${err.message}`);
      }
    }

    await devClient.query("SET session_replication_role = 'origin'");

    // Reset sequences so future INSERTs generate correct IDs
    const seqRes = await devClient.query(`
      SELECT sequence_name
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
    `);

    for (const { sequence_name } of seqRes.rows) {
      const tableName = sequence_name.replace(/_id_seq$/, "");
      try {
        await devClient.query(
          `SELECT setval('${sequence_name}', COALESCE((SELECT MAX(id) FROM "${tableName}"), 1))`
        );
      } catch {
        // sequence may not match a table with an id column — safe to ignore
      }
    }

    console.log(`\n✅  Cópia concluída!`);
    console.log(`   Tabelas copiadas : ${totalTables}`);
    console.log(`   Registros totais : ${totalRecords}`);
  } catch (err) {
    console.error("\n❌  Erro durante a cópia:", err.message);
    process.exit(1);
  } finally {
    prodClient?.release();
    devClient?.release();
    await prod.end();
    await dev.end();
  }
}

main();
