const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function runCommand(desc, command) {
  console.log(`\n============================================`);
  console.log(`[CI/CD] Stage: ${desc}`);
  console.log(`Running: ${command}`);
  console.log(`============================================`);
  try {
    execSync(command, { stdio: "inherit", cwd: path.join(__dirname, "..") });
    console.log(`[SUCCESS] Stage: ${desc}`);
    return true;
  } catch (err) {
    console.error(`[FAILURE] Stage: ${desc} failed!`);
    return false;
  }
}

function main() {
  console.log("Starting Enterprise School ERP CI/CD Pipeline Verification...");

  // 1. Lint checks
  // (Optional: npm run lint if configured. We'll simulate type checking as lint proxy)

  // 2. Type checking
  if (!runCommand("Type Check Verification", "npx tsc --noEmit")) {
    process.exit(1);
  }

  // 3. Unit tests
  if (!runCommand("Unit Testing Suite", "npm run test")) {
    process.exit(1);
  }

  // 4. Integration / E2E contract tests
  if (!runCommand("Integration E2E Contract Suite", "npm run test:e2e")) {
    process.exit(1);
  }

  // 5. Run ESOS Twin Simulator
  if (!runCommand("ESOS Simulation Verification", "npx ts-node -r tsconfig-paths/register src/testing/simulator/esos-runner.ts")) {
    process.exit(1);
  }

  // 6. Verify Dashboards and Reports exist
  const brainDir = "C:\\Users\\Hp\\.gemini\\antigravity-ide\\brain\\07fae952-f7d2-4940-8484-b0a13be8f97a";
  const requiredFiles = [
    "coverage_dashboard.json",
    "coverage_dashboard.html",
    "readiness_dashboard.json",
    "readiness_dashboard.html",
    "release-history.json"
  ];

  console.log("\n[CI/CD] Verifying Artifact Outputs...");
  for (const file of requiredFiles) {
    const filePath = path.join(brainDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`[FAILURE] Required output report missing: ${file}`);
      process.exit(1);
    }
  }

  console.log("\n============================================");
  console.log("       ALL CI/CD RELEASE GATES PASSED!");
  console.log("============================================");
  process.exit(0);
}

main();
