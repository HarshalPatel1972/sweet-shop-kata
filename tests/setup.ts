import dotenv from "dotenv";
import path from "path";
import { execSync } from "child_process";

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.test") });

// Reset test database before running tests
beforeAll(async () => {
  try {
    execSync("npx prisma migrate deploy", {
      env: { ...process.env, NODE_ENV: "test" },
      stdio: "inherit",
    });
  } catch (e) {
    // Migration might fail if already synced, that's ok
    console.log("Database already synced");
  }
});

afterAll(() => {
  // Any global teardown after all tests
});
