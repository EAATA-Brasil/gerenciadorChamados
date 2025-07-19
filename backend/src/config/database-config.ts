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

  // ✅ Se não configurou nada → usa SQLite por padrão
  return {
    type: "sqlite" as const,
    database: "./data.sqlite",
    autoLoadEntities: true,
    synchronize: true,
  };
}
