#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 * 
 * Validates that all required environment variables are set and correctly formatted.
 * Can be run locally or in CI/CD pipelines.
 * 
 * Usage:
 *   tsx scripts/check-env.ts [--env=production] [--strict] [--platform=vercel]
 * 
 * Options:
 *   --env: Environment to validate (local|development|preview|staging|production)
 *   --strict: Fail if any optional vars are missing (default: false)
 *   --platform: Platform-specific validation (github|vercel|supabase|local|docker)
 *   --json: Output results as JSON
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import {
  ENV_VAR_SCHEMA,
  getRequiredEnvVars,
  getEnvVarsByPlatform,
  validateEnvVar,
  EnvVarSpec,
} from '../config/env.schema';

interface ValidationResult {
  name: string;
  status: 'ok' | 'missing' | 'invalid' | 'optional-missing';
  value?: string;
  error?: string;
  spec: EnvVarSpec;
}

interface ValidationReport {
  environment: string;
  platform?: string;
  total: number;
  required: number;
  optional: number;
  passed: number;
  failed: number;
  results: ValidationResult[];
  summary: {
    missing: string[];
    invalid: string[];
    warnings: string[];
  };
}

function parseArgs(): {
  env: 'local' | 'development' | 'preview' | 'staging' | 'production';
  strict: boolean;
  platform?: 'github' | 'vercel' | 'supabase' | 'local' | 'docker';
  json: boolean;
} {
  const args = process.argv.slice(2);
  let env: 'local' | 'development' | 'preview' | 'staging' | 'production' = 'production';
  let strict = false;
  let platform: 'github' | 'vercel' | 'supabase' | 'local' | 'docker' | undefined;
  let json = false;

  for (const arg of args) {
    if (arg.startsWith('--env=')) {
      const envValue = arg.split('=')[1] as typeof env;
      if (['local', 'development', 'preview', 'staging', 'production'].includes(envValue)) {
        env = envValue;
      }
    } else if (arg === '--strict') {
      strict = true;
    } else if (arg.startsWith('--platform=')) {
      platform = arg.split('=')[1] as typeof platform;
    } else if (arg === '--json') {
      json = true;
    }
  }

  // Infer environment from NODE_ENV if not specified
  if (process.env.NODE_ENV && !args.some((a) => a.startsWith('--env='))) {
    const nodeEnv = process.env.NODE_ENV.toLowerCase();
    if (['development', 'production', 'staging'].includes(nodeEnv)) {
      env = nodeEnv as typeof env;
    }
  }

  return { env, strict, platform, json };
}

function validateEnvironment(
  environment: string,
  platform?: string,
  strict = false
): ValidationReport {
  // Get relevant env vars
  let varsToCheck: EnvVarSpec[] = ENV_VAR_SCHEMA;

  if (platform) {
    varsToCheck = getEnvVarsByPlatform(platform);
  }

  // Filter by environment
  varsToCheck = varsToCheck.filter(
    (spec) =>
      spec.environments.includes(environment as any) ||
      spec.environments.includes('local') ||
      spec.scope === 'ci-only'
  );

  const results: ValidationResult[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  for (const spec of varsToCheck) {
    const value = process.env[spec.name];
    const validation = validateEnvVar(spec, value || '');

    let status: ValidationResult['status'] = 'ok';
    let error: string | undefined;

    if (!value) {
      if (spec.required) {
        status = 'missing';
        missing.push(spec.name);
        error = `Required but not set`;
      } else if (strict) {
        status = 'optional-missing';
        warnings.push(`${spec.name} is optional but not set (strict mode)`);
      } else {
        status = 'ok'; // Optional and not set is OK
      }
    } else if (!validation.valid) {
      status = 'invalid';
      invalid.push(spec.name);
      error = validation.error;
    }

    // Check for suspicious values (hardcoded secrets)
    if (value && spec.secret) {
      const suspiciousPatterns = [
        /^your-.*-key$/i,
        /^change-.*-production$/i,
        /^test.*key$/i,
        /^12345/,
        /^password$/i,
        /^secret$/i,
        /^default$/i,
        /^dev-secret/i,
      ];

      if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
        warnings.push(`${spec.name} appears to have a placeholder/hardcoded value`);
      }
    }

    results.push({
      name: spec.name,
      status,
      value: spec.secret && value ? '***REDACTED***' : value,
      error,
      spec,
    });
  }

  const required = varsToCheck.filter((v) => v.required).length;
  const optional = varsToCheck.length - required;
  const passed = results.filter((r) => r.status === 'ok').length;
  const failed = results.filter((r) => r.status === 'missing' || r.status === 'invalid').length;

  return {
    environment,
    platform,
    total: varsToCheck.length,
    required,
    optional,
    passed,
    failed,
    results,
    summary: {
      missing,
      invalid,
      warnings,
    },
  };
}

function printReport(report: ValidationReport, json = false): void {
  if (json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Environment Variable Validation Report`);
  console.log('='.repeat(80));
  console.log(`Environment: ${report.environment}`);
  if (report.platform) {
    console.log(`Platform: ${report.platform}`);
  }
  console.log(`Total Variables: ${report.total}`);
  console.log(`Required: ${report.required}`);
  console.log(`Optional: ${report.optional}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log('='.repeat(80) + '\n');

  // Group results by status
  const missing = report.results.filter((r) => r.status === 'missing');
  const invalid = report.results.filter((r) => r.status === 'invalid');
  const optionalMissing = report.results.filter((r) => r.status === 'optional-missing');
  const ok = report.results.filter((r) => r.status === 'ok');

  if (missing.length > 0) {
    console.log('❌ MISSING REQUIRED VARIABLES:');
    console.log('-'.repeat(80));
    for (const result of missing) {
      console.log(`  ${result.name}`);
      console.log(`    Description: ${result.spec.description}`);
      console.log(`    Format: ${result.spec.format || 'N/A'}`);
      console.log(`    Platforms: ${result.spec.platforms.join(', ')}`);
      if (result.spec.notes) {
        console.log(`    Note: ${result.spec.notes}`);
      }
      console.log('');
    }
  }

  if (invalid.length > 0) {
    console.log('⚠️  INVALID VARIABLES:');
    console.log('-'.repeat(80));
    for (const result of invalid) {
      console.log(`  ${result.name}`);
      console.log(`    Error: ${result.error}`);
      console.log(`    Format: ${result.spec.format || 'N/A'}`);
      console.log('');
    }
  }

  if (optionalMissing.length > 0) {
    console.log('ℹ️  OPTIONAL VARIABLES NOT SET (strict mode):');
    console.log('-'.repeat(80));
    for (const result of optionalMissing) {
      console.log(`  ${result.name}: ${result.spec.description}`);
    }
    console.log('');
  }

  if (report.summary.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    console.log('-'.repeat(80));
    for (const warning of report.summary.warnings) {
      console.log(`  ${warning}`);
    }
    console.log('');
  }

  if (ok.length > 0 && process.env.DEBUG) {
    console.log('✅ VALID VARIABLES:');
    console.log('-'.repeat(80));
    for (const result of ok.slice(0, 10)) {
      // Show first 10 in debug mode
      console.log(`  ${result.name}`);
    }
    if (ok.length > 10) {
      console.log(`  ... and ${ok.length - 10} more`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  if (report.failed > 0) {
    console.log('❌ VALIDATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ VALIDATION PASSED');
    process.exit(0);
  }
}

// Main execution
function main(): void {
  const { env, strict, platform, json } = parseArgs();
  const report = validateEnvironment(env, platform, strict);
  printReport(report, json);
}

if (require.main === module) {
  main();
}

export { validateEnvironment, ValidationReport, ValidationResult };
