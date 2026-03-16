/**
 * SANCTUARY — Seed Script
 * Run: npm run db:seed
 *
 * Creates: 1 Admin, 2 Members, 3 Prayers (1 anonymous), 2 Devotionals, 2 Events, sample RSVPs
 * Deterministic, idempotent (clears and recreates).
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

const DEMO_PASSWORD = "demo123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);

  // Clear existing data (order respects FKs)
  await prisma.rSVP.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.prayerReaction.deleteMany();
  await prisma.prayerRequest.deleteMany();
  await prisma.devotional.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Users: 1 admin, 2 members
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@sanctuary.demo",
      passwordHash,
      role: "ADMIN",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      name: "Alice Member",
      email: "alice@sanctuary.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      name: "Bob Member",
      email: "bob@sanctuary.demo",
      passwordHash,
      role: "MEMBER",
    },
  });

  // Prayer requests: 3 total, 1 anonymous
  const prayer1 = await prisma.prayerRequest.create({
    data: {
      authorId: member1.id,
      content: "Please pray for my family during this difficult season.",
      isAnonymous: false,
      status: "ACTIVE",
    },
  });

  const prayer2 = await prisma.prayerRequest.create({
    data: {
      authorId: member2.id,
      content: "Seeking strength and wisdom for an important decision.",
      isAnonymous: true,
      status: "ACTIVE",
    },
  });

  const prayer3 = await prisma.prayerRequest.create({
    data: {
      authorId: member1.id,
      content: "Thankful for answered prayer — my health has improved!",
      isAnonymous: false,
      status: "ANSWERED",
    },
  });

  // Comments on prayers
  await prisma.comment.create({
    data: {
      prayerRequestId: prayer1.id,
      authorId: member2.id,
      content: "Praying for you and your family.",
    },
  });

  await prisma.comment.create({
    data: {
      prayerRequestId: prayer3.id,
      authorId: admin.id,
      content: "So glad to hear this! Praise God.",
    },
  });

  // Devotionals: 2
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.devotional.create({
    data: {
      authorId: admin.id,
      title: "Trust in the Lord",
      scriptureReference: "Proverbs 3:5-6",
      content: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
      publishDate: yesterday,
    },
  });

  await prisma.devotional.create({
    data: {
      authorId: admin.id,
      title: "Peace That Surpasses",
      scriptureReference: "Philippians 4:6-7",
      content: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.",
      publishDate: now,
    },
  });

  // Events: 2
  const event1 = await prisma.event.create({
    data: {
      title: "Sunday Worship",
      description: "Join us for worship and fellowship.",
      eventDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      location: "Main Sanctuary",
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "Small Group Bible Study",
      description: "Weekly Bible study and discussion.",
      eventDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
      location: "Fellowship Hall",
    },
  });

  // Sample RSVPs
  await prisma.rSVP.create({
    data: { userId: member1.id, eventId: event1.id },
  });
  await prisma.rSVP.create({
    data: { userId: member2.id, eventId: event1.id },
  });
  await prisma.rSVP.create({
    data: { userId: member1.id, eventId: event2.id },
  });

  console.log("Seed complete:");
  console.log("  - 1 admin, 2 members");
  console.log("  - 3 prayer requests (1 anonymous)");
  console.log("  - 2 devotionals");
  console.log("  - 2 events");
  console.log("  - 3 RSVPs");
  console.log("");
  console.log("Demo credentials (password: demo123):");
  console.log("  Admin:  admin@sanctuary.demo");
  console.log("  Member: alice@sanctuary.demo");
  console.log("  Member: bob@sanctuary.demo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
