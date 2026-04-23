#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Multi-agent AI pipeline.
 *
 * Runs 6 agents in a loop against a single source file:
 *   1. Coder          applies aggregated feedback to the file
 *   2. TestGenerator  writes a Jest test file for the source
 *   3. TestRunner     runs `npx jest <file>.test.ts --no-coverage`
 *   4. Reviewer       TypeScript / SOLID / DRY / perf review
 *   5. Security       injection, secrets, auth, OWASP Top 10
 *   6. Orchestrator   returns "DONE" or "ITERATE"
 *
 * Loops at most 3 iterations, stops early on DONE.
 * Writes pipeline.log (per-action timestamps) and pipeline-report.txt (final summary).
 *
 * Usage:
 *   npx ts-node agents.ts src/myFile.ts
 */

import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────
const MODEL = "claude-sonnet-4-20250514";
const MAX_ITERATIONS = 3;
const LOG_FILE = "pipeline.log";
const REPORT_FILE = "pipeline-report.txt";
const TEST_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_TOKENS = 8_000;

// ─── Anthropic client ────────────────────────────────────────────────────────
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set.");
  process.exit(1);
}
const anthropic = new Anthropic({ apiKey });

// ─── Logging ─────────────────────────────────────────────────────────────────
function log(agent: string, msg: string): void {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${agent}] ${msg}`;
  fs.appendFileSync(LOG_FILE, line + "\n");
  console.log(line);
}

// ─── Message helpers ─────────────────────────────────────────────────────────
function extractText(msg: Anthropic.Message): string {
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

async function callAgent(
  agent: string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = MAX_OUTPUT_TOKENS,
): Promise<string> {
  log(agent, "calling model");
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const out = extractText(res).trim();
    log(agent, `returned ${out.length} chars (stop_reason=${res.stop_reason})`);
    return out;
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    log(agent, `ERROR: ${msg}`);
    return `[${agent} error: ${msg}]`;
  }
}

// Strip accidental code fences from model outputs that should be pure code.
function stripFences(raw: string): string {
  const fence = /^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/m;
  const m = raw.match(fence);
  return m ? m[1] : raw;
}

// ─── Agent 1 — Coder ─────────────────────────────────────────────────────────
async function coder(
  filePath: string,
  code: string,
  feedback: string,
): Promise<string> {
  const system =
    "You are an expert software engineer. You receive a source file plus aggregated feedback " +
    "from a code review, a security audit, and a test run. Apply EVERY fix the feedback justifies. " +
    "Return the COMPLETE fixed file contents. Do NOT include markdown fences, commentary, " +
    "backticks, or any text outside the file body. If the feedback is empty or nothing needs to change, " +
    "return the original code unchanged.";
  const user =
    `File path: ${filePath}\n\n` +
    `--- CURRENT FILE ---\n${code}\n--- END CURRENT FILE ---\n\n` +
    `--- FEEDBACK ---\n${feedback || "No feedback."}\n--- END FEEDBACK ---\n\n` +
    "Return only the updated file contents.";
  const raw = await callAgent("CODER", system, user);
  return stripFences(raw);
}

// ─── Agent 2 — Test Generator ────────────────────────────────────────────────
async function testGenerator(filePath: string, code: string): Promise<string> {
  const system =
    "You are a Jest test generator for TypeScript. Produce a COMPLETE Jest test file covering: " +
    "(a) unit tests for each exported function/class, (b) integration tests for happy paths, " +
    "(c) edge cases, and (d) error conditions. Mock ALL external dependencies: network calls, " +
    "databases, filesystem, environment variables. Use standard jest.mock() and jest.fn(). " +
    "Return the test file contents only — no markdown fences, no commentary.";
  const user = `File path: ${filePath}\n\n--- SOURCE FILE ---\n${code}\n--- END ---`;
  const raw = await callAgent("TESTGEN", system, user);
  return stripFences(raw);
}

// ─── Agent 3 — Test Runner ───────────────────────────────────────────────────
interface TestResult {
  output: string;
  passed: boolean;
}

function testRunner(testFile: string): TestResult {
  log("RUNNER", `npx jest ${testFile} --no-coverage`);
  try {
    const out = execSync(`npx jest ${JSON.stringify(testFile)} --no-coverage`, {
      encoding: "utf-8",
      timeout: TEST_TIMEOUT_MS,
      stdio: "pipe",
      env: { ...process.env, CI: "true" },
    });
    log("RUNNER", "jest exited 0 (pass)");
    return { output: out, passed: true };
  } catch (err: any) {
    const stdout = (err?.stdout ?? "").toString();
    const stderr = (err?.stderr ?? "").toString();
    const combined = `${stdout}\n${stderr}`.trim() || err?.message || String(err);
    log("RUNNER", `jest exited non-zero (fail)`);
    return { output: combined, passed: false };
  }
}

// ─── Agent 4 — Reviewer ──────────────────────────────────────────────────────
async function reviewer(filePath: string, code: string): Promise<string> {
  const system =
    "You are a senior TypeScript reviewer. Check: " +
    "(1) TypeScript strictness — no implicit any, proper generics, correct narrowing. " +
    "(2) Naming and readability — clear identifiers, appropriate abstraction. " +
    "(3) Performance — unnecessary allocations, N+1 patterns, blocking I/O. " +
    "(4) Error handling — unhandled promise rejections, swallowed errors, missing guards. " +
    "(5) SOLID/DRY violations. " +
    "Return a numbered list of SPECIFIC, ACTIONABLE issues. " +
    "If the file is clean, reply with exactly: No issues found.";
  const user = `File path: ${filePath}\n\n${code}`;
  return callAgent("REVIEWER", system, user);
}

// ─── Agent 5 — Security ──────────────────────────────────────────────────────
async function security(filePath: string, code: string): Promise<string> {
  const system =
    "You are a security auditor. Check for: " +
    "SQL injection, XSS, command/shell injection, hardcoded secrets/API keys, " +
    "missing input validation, unsafe eval() / new Function() / innerHTML, " +
    "missing authentication/authorization checks, path traversal, SSRF, insecure deserialization, " +
    "and the OWASP Top 10. " +
    "Return a numbered list. Each finding MUST start with a severity token: HIGH, MEDIUM, or LOW. " +
    "If clean, reply with exactly: No security issues found.";
  const user = `File path: ${filePath}\n\n${code}`;
  return callAgent("SECURITY", system, user);
}

// ─── Agent 6 — Orchestrator ──────────────────────────────────────────────────
async function orchestrator(
  testOutput: string,
  testPassed: boolean,
  reviewOutput: string,
  securityOutput: string,
): Promise<"DONE" | "ITERATE"> {
  const system =
    "You are the pipeline orchestrator. Given test output, review output, and security output, " +
    "decide whether the code is ready to ship. " +
    "Reply with EXACTLY one word and nothing else: DONE or ITERATE. " +
    "DONE = tests pass AND review is clean AND no critical security issues. " +
    "ITERATE = tests fail, or review/security issues remain that are worth fixing.";
  const user =
    `TEST PASSED: ${testPassed}\n\n` +
    `TEST OUTPUT:\n${testOutput}\n\n` +
    `REVIEW:\n${reviewOutput}\n\n` +
    `SECURITY:\n${securityOutput}`;
  const raw = (await callAgent("ORCHESTRATOR", system, user, 50)).toUpperCase();
  // Bias toward ITERATE if the model didn't give a clean signal.
  if (raw.includes("DONE") && !raw.includes("ITERATE")) return "DONE";
  return "ITERATE";
}

// ─── Pipeline ────────────────────────────────────────────────────────────────
function derivedTestPath(filePath: string): string {
  const ext = path.extname(filePath);
  const base = filePath.slice(0, -ext.length);
  return `${base}.test${ext}`;
}

function hasIssues(
  testPassed: boolean,
  reviewOutput: string,
  securityOutput: string,
): boolean {
  if (!testPassed) return true;
  if (!/^no issues found\.?$/i.test(reviewOutput.trim())) return true;
  if (!/^no security issues found\.?$/i.test(securityOutput.trim())) return true;
  return false;
}

async function runPipeline(targetFile: string): Promise<void> {
  if (!fs.existsSync(targetFile)) {
    console.error(`File not found: ${targetFile}`);
    process.exit(1);
  }
  if (/\.test\.(ts|js|tsx|jsx)$/.test(targetFile)) {
    console.error(`Refusing to run on a test file: ${targetFile}`);
    process.exit(1);
  }

  // Fresh log file
  fs.writeFileSync(LOG_FILE, "");
  const testFile = derivedTestPath(targetFile);

  log("PIPELINE", `Target: ${targetFile}`);
  log("PIPELINE", `Test file: ${testFile}`);
  log("PIPELINE", `Model: ${MODEL}`);

  let iteration = 0;
  let decision: "DONE" | "ITERATE" = "ITERATE";
  let lastTestOutput = "";
  let lastReview = "";
  let lastSecurity = "";
  let lastTestPassed = false;

  while (iteration < MAX_ITERATIONS && decision !== "DONE") {
    iteration += 1;
    log("PIPELINE", `═══ Iteration ${iteration} / ${MAX_ITERATIONS} ═══`);

    const code = fs.readFileSync(targetFile, "utf-8");

    // 1. Generate tests
    const testCode = await testGenerator(targetFile, code);
    fs.writeFileSync(testFile, testCode);
    log("PIPELINE", `wrote ${testFile}`);

    // 2. Run tests
    const runRes = testRunner(testFile);
    lastTestOutput = runRes.output;
    lastTestPassed = runRes.passed;

    // 3. Review + 4. Security (run in parallel to save time)
    const [reviewOut, secOut] = await Promise.all([
      reviewer(targetFile, code),
      security(targetFile, code),
    ]);
    lastReview = reviewOut;
    lastSecurity = secOut;

    // 5. Coder applies fixes (only if anything is flagged)
    if (hasIssues(lastTestPassed, lastReview, lastSecurity)) {
      const feedback =
        `TEST RESULTS (passed=${lastTestPassed}):\n${lastTestOutput}\n\n` +
        `REVIEW FEEDBACK:\n${lastReview}\n\n` +
        `SECURITY FEEDBACK:\n${lastSecurity}`;
      const fixed = await coder(targetFile, code, feedback);
      if (fixed && fixed.trim() !== code.trim()) {
        fs.writeFileSync(targetFile, fixed);
        log("PIPELINE", `coder rewrote ${targetFile} (${fixed.length} chars)`);
      } else {
        log("PIPELINE", "coder returned unchanged content");
      }
    } else {
      log("PIPELINE", "no issues — skipping coder step");
    }

    // 6. Orchestrator decides
    decision = await orchestrator(
      lastTestOutput,
      lastTestPassed,
      lastReview,
      lastSecurity,
    );
    log("PIPELINE", `orchestrator: ${decision}`);
  }

  // Final report
  const report =
    `═══════════════════════════════\n` +
    `PIPELINE COMPLETE — ${path.basename(targetFile)}\n` +
    `Iterations: ${iteration}\n` +
    `Final decision: ${decision}\n` +
    `═══════════════════════════════\n` +
    `FINAL TEST RESULTS:\n${lastTestOutput || "(no output)"}\n\n` +
    `FINAL REVIEW:\n${lastReview || "(no output)"}\n\n` +
    `SECURITY REPORT:\n${lastSecurity || "(no output)"}\n`;

  fs.writeFileSync(REPORT_FILE, report);
  log("PIPELINE", `report written to ${REPORT_FILE}`);
  console.log("\n" + report);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────
const target = process.argv[2];
if (!target) {
  console.error("Usage: npx ts-node agents.ts <path/to/file.ts>");
  process.exit(1);
}

runPipeline(target).catch((err) => {
  console.error("Pipeline crashed:", err);
  process.exit(1);
});
