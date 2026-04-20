import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { companiesTable, usersTable } from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function seed() {
  console.log("🌱 Seeding database...");

  // 1️⃣ Insert company
  const [company] = await db
    .insert(companiesTable)
    .values({
      id: 1,
      name: "Bitlabs",
      isActive: true,
    })
    .returning({ id: companiesTable.id });

  // 2️⃣ Insert admin user
  await db.insert(usersTable).values({
    email: "pasindu14@gmail.com",
    passwordHash: "$2b$12$fHnSFI0.lARWCfhVclH1le3Y2s/A4EsaRs08DmeTrkPN6yCSRkVYq", // password: password
    role: "admin",
    companyId: company.id,
    isActive: true,
  });

  console.log("✅ Company + Admin user seeded successfully!");
  await pool.end();
}

seed().catch(console.error);
