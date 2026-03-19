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
  console.error("   Adicione a connection string do banco de produção como secret PROD_DATABASE_URL e tente novamente.");
  process.exit(1);
}

if (!DEV_URL) {
  console.error("❌  DATABASE_URL não está definida.");
  process.exit(1);
}

// ── Diagnóstico: confirmar que são bancos diferentes ────────────────────────
console.log("🔍  Verificando connection strings:");
console.log(`   Production  (PROD_DATABASE_URL) : ${PROD_URL.slice(0, 30)}...`);
console.log(`   Development (DATABASE_URL)       : ${DEV_URL.slice(0, 30)}...`);

if (PROD_URL === DEV_URL) {
  console.error("\n❌  As duas URLs são idênticas — abortando para proteger os dados.");
  process.exit(1);
}
console.log("   ✅  URLs diferentes — bancos confirmados como distintos.\n");
// ────────────────────────────────────────────────────────────────────────────

const prod = new Pool({ connectionString: PROD_URL, ssl: { rejectUnauthorized: false } });
const dev  = new Pool({ connectionString: DEV_URL,  ssl: { rejectUnauthorized: false } });

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
      AND table_name   = $1
    ORDER BY ordinal_position
  `, [table]);
  return res.rows.map((r) => ({
    name:   r.column_name,
    isJson: ["json", "jsonb"].includes(r.data_type) || ["json", "jsonb"].includes(r.udt_name),
  }));
}

function sanitizeValue(value, isJson) {
  if (!isJson) return value;
  if (value === null || value === undefined) return null;
  // pg parses json/jsonb columns into JS objects — stringify back for INSERT params
  if (typeof value === "object") {
    try { return JSON.stringify(value); } catch { return null; }
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "null") return null;
    try { JSON.parse(trimmed); return trimmed; } catch { return null; }
  }
  return value;
}

async function insertTable(prodClient, devClient, table) {
  const colMeta = await getColumnMeta(prodClient, table);
  if (colMeta.length === 0) return 0;

  const cols = colMeta.map((c) => c.name);
  const { rows } = await prodClient.query(`SELECT * FROM "${table}"`);
  if (rows.length === 0) return 0;

  const BATCH = 500;
  const quotedCols = cols.map((c) => `"${c}"`).join(", ");

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const placeholders = batch
      .map((_, ri) => `(${cols.map((_, ci) => `$${ri * cols.length + ci + 1}`).join(", ")})`)
      .join(", ");
    const values = batch.flatMap((row) =>
      colMeta.map((col) => sanitizeValue(row[col.name], col.isJson))
    );
    await devClient.query(
      `INSERT INTO "${table}" (${quotedCols}) VALUES ${placeholders}`,
      values
    );
  }

  return rows.length;
}

async function countInDev(devClient, table) {
  const res = await devClient.query(`SELECT COUNT(*) AS n FROM "${table}"`);
  return parseInt(res.rows[0].n, 10);
}

async function main() {
  console.log("🚀  Iniciando cópia: Produção → Desenvolvimento\n");

  let prodClient, devClient;

  try {
    prodClient = await prod.connect();
    devClient  = await dev.connect();
    console.log("✅  Conectado ao banco de Produção");
    console.log("✅  Conectado ao banco de Desenvolvimento\n");

    const tables = await getTables(prodClient);
    console.log(`📋  ${tables.length} tabela(s): ${tables.join(", ")}\n`);

    // ── FASE 1: Truncar TODAS as tabelas num único statement ─────────────────
    // Um único TRUNCATE listando todas as tabelas com CASCADE resolve as FKs
    // de uma vez só, sem cascatear para tabelas fora da lista.
    // RESTART IDENTITY zera as sequences antes de inserir os dados da produção.
    console.log("🗑️   Fase 1 — Limpando todas as tabelas no Development...");
    const tableList = tables.map((t) => `"${t}"`).join(", ");
    await devClient.query(`TRUNCATE ${tableList} RESTART IDENTITY CASCADE`);
    console.log(`   ✅  ${tables.length} tabela(s) truncada(s).\n`);

    // ── FASE 2: Inserir dados da Produção ─────────────────────────────────
    // session_replication_role = 'replica' desabilita verificação de FK nos INSERTs,
    // permitindo inserir na ordem alfabética sem depender da ordem das dependências.
    await devClient.query("SET session_replication_role = 'replica'");
    console.log("📥  Fase 2 — Copiando dados da Produção para o Development...");
    let totalRecords = 0;
    let totalTables  = 0;

    for (const table of tables) {
      process.stdout.write(`  📄  ${table} ... `);
      try {
        const inserted = await insertTable(prodClient, devClient, table);
        const devCount = await countInDev(devClient, table);
        const mark = devCount === inserted ? "✅" : "⚠️ ";
        console.log(`inseridos: ${inserted}  |  COUNT(*) no Dev: ${devCount} ${mark}`);
        totalRecords += inserted;
        totalTables++;
      } catch (err) {
        console.log(`❌ ERRO: ${err.message}`);
      }
    }

    // ── Re-enable FK checks ─────────────────────────────────────────────────
    await devClient.query("SET session_replication_role = 'origin'");

    // ── Reset sequences ─────────────────────────────────────────────────────
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
      } catch { /* ignore sequences without matching id column */ }
    }

    console.log(`\n✅  Cópia concluída!`);
    console.log(`   Tabelas copiadas : ${totalTables}`);
    console.log(`   Registros totais : ${totalRecords}`);

  } catch (err) {
    console.error("\n❌  Erro fatal:", err.message);
    process.exit(1);
  } finally {
    prodClient?.release();
    devClient?.release();
    await prod.end();
    await dev.end();
  }
}

main();
