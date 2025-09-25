import * as fs from "fs";
import * as path from "path";

const CONFIG_PATH = path.join(__dirname, "..", "..", "config.json");

export function getDatabaseConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

    if (data.dbUrl && data.dbUrl.startsWith("postgres")) {
      // Se for Postgres, retorna a config apropriada
      return {
        type: "postgres" as const,
        url: data.dbUrl,
        autoLoadEntities: true,
        synchronize: true,
      };
    }

    if (data.dbUrl && data.dbUrl.startsWith("mysql")) {
      return {
        type: "mysql" as const,
        url: data.dbUrl,
        autoLoadEntities: true,
        synchronize: true,
      };
    }
  }

  // ✅ Se não configurou nada → usa better-sqlite3 por padrão
  return {
    type: "better-sqlite3" as const, // Alterado de "sqlite" para "better-sqlite3"
    database: "./data.sqlite",
    autoLoadEntities: true,
    synchronize: true,
  };
}
