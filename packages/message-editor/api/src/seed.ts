/**
 * Seed script — writes sample messages to data/messages.json
 * Run: npx ts-node-dev --esm src/seed.ts
 * or:  node --loader ts-node/esm src/seed.ts
 */
import { createJsonFileStore } from "./storage/jsonFileStore.js";

const store = createJsonFileStore();

async function seed() {
  const existing = await store.getAll();
  if (existing.length > 0) {
    console.log(`Skipping seed — ${existing.length} message(s) already exist. Delete data/messages.json to re-seed.`);
    return;
  }

  await store.create({
    title: "{{unTranscribedMinutes}} minutes of calls are waiting to be transcribed",
    body: "Your team made {{totalCallsThisMonth}} calls this month, but {{unTranscribedMinutes}} minutes haven't been transcribed. Upgrade to Advanced IQ to unlock automatic transcription and never miss a detail from your calls.",
    upgradePath: "Essential→Advanced",
    scope: { dateRange: "last_month", userGroup: "my_organization" },
    triggerConditions: [
      { kpi: "unTranscribedMinutes", operator: "gt", threshold: 60 },
    ],
    status: "active",
    displayOrder: 1,
  });

  await store.create({
    title: "{{unlicencedUserCount}} team members can't access call recordings",
    body: "{{unlicencedUserCount}} users in your organisation are on unlicenced seats. Upgrading to Advanced IQ gives every team member access to call recordings, searchable transcripts, and coaching insights.",
    upgradePath: "Essential→Advanced",
    scope: { dateRange: "last_month", userGroup: "my_organization" },
    triggerConditions: [
      { kpi: "unlicencedUserCount", operator: "gte", threshold: 3 },
    ],
    status: "inactive",
    displayOrder: 2,
  });

  await store.create({
    title: "Your team is ready for AI-powered call coaching",
    body: "With {{activeUserCount}} active users making calls every day, your team is at the scale where Ultimate IQ's AI coaching and real-time analytics deliver the highest ROI. See what your top performers do differently — and replicate it across the team.",
    upgradePath: "Advanced→UltimateIQ",
    scope: { dateRange: "last_month", userGroup: "my_organization" },
    triggerConditions: [
      { kpi: "activeUserCount", operator: "gte", threshold: 10 },
    ],
    status: "inactive",
    displayOrder: 1,
  });

  console.log("Seeded 3 sample messages.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
