import { Command } from "commander";
import chalk from "chalk";
import Reconcilify from "@reconcilify/sdk";

const jobsCommand = new Command("jobs");

jobsCommand
  .description("Manage reconciliation jobs")
  .alias("job");

jobsCommand
  .command("list")
  .description("List all reconciliation jobs")
  .action(async (options) => {
    try {
      const apiKey = process.env.RECONCILIFY_API_KEY || options.parent.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required. Set RECONCILIFY_API_KEY or use --api-key"));
        process.exit(1);
      }

      const client = new Reconcilify({
        apiKey,
        baseUrl: options.parent.baseUrl,
      });

      const response = await client.jobs.list();
      
      if (response.data.length === 0) {
        console.log(chalk.yellow("No jobs found."));
        return;
      }

      console.log(chalk.bold("\nReconciliation Jobs:\n"));
      response.data.forEach((job) => {
        console.log(chalk.cyan(`  ${job.id}`));
        console.log(`    Name: ${job.name}`);
        console.log(`    Status: ${job.status}`);
        console.log(`    Created: ${new Date(job.createdAt).toLocaleString()}`);
        console.log();
      });
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      process.exit(1);
    }
  });

jobsCommand
  .command("create")
  .description("Create a new reconciliation job")
  .option("-n, --name <name>", "Job name")
  .option("-s, --source <adapter>", "Source adapter")
  .option("-t, --target <adapter>", "Target adapter")
  .action(async (options) => {
    try {
      const apiKey = process.env.RECONCILIFY_API_KEY || options.parent.parent.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required"));
        process.exit(1);
      }

      // In a real CLI, you'd use inquirer for interactive prompts
      console.log(chalk.yellow("Creating job..."));
      console.log(chalk.gray("Note: Use the web UI or API for full configuration"));
      
      const client = new Reconcilify({
        apiKey,
        baseUrl: options.parent.parent.baseUrl,
      });

      // Example job creation
      const response = await client.jobs.create({
        name: options.name || "New Reconciliation Job",
        source: {
          adapter: options.source || "shopify",
          config: {},
        },
        target: {
          adapter: options.target || "stripe",
          config: {},
        },
        rules: {
          matching: [
            { field: "order_id", type: "exact" },
            { field: "amount", type: "exact", tolerance: 0.01 },
          ],
        },
      });

      console.log(chalk.green(`\n✓ Job created: ${response.data.id}`));
      console.log(chalk.gray(`  Name: ${response.data.name}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      process.exit(1);
    }
  });

jobsCommand
  .command("run <id>")
  .description("Run a reconciliation job")
  .action(async (id, options) => {
    try {
      const apiKey = process.env.RECONCILIFY_API_KEY || options.parent.apiKey;
      if (!apiKey) {
        console.error(chalk.red("Error: API key required"));
        process.exit(1);
      }

      const client = new Reconcilify({
        apiKey,
        baseUrl: options.parent.baseUrl,
      });

      const response = await client.jobs.run(id);
      console.log(chalk.green(`\n✓ Job execution started: ${response.data.id}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : "Unknown error"}`));
      process.exit(1);
    }
  });

export { jobsCommand };
