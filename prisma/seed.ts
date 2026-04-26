/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_TAXONOMY } from "../src/lib/taxonomy-data";
import { DEFAULT_SUPPORT_CATEGORIES } from "../src/lib/support-data";

const prisma = new PrismaClient();

const IMG = {
  dance: [
    "https://images.unsplash.com/photo-1535525153412-5a092d46317e?w=1200",
    "https://images.unsplash.com/photo-1547153760-18fc86324498?w=1200",
  ],
  guitar: [
    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200",
    "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200",
  ],
  pottery: [
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200",
    "https://images.unsplash.com/photo-1603712725038-e9334ae8f39f?w=1200",
  ],
  coding: [
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200",
  ],
  yoga: [
    "https://images.unsplash.com/photo-1599447421416-3414500d18a5?w=1200",
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1200",
  ],
  chess: [
    "https://images.unsplash.com/photo-1528819622765-d6bcf132f793?w=1200",
    "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=1200",
  ],
  cooking: [
    "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?w=1200",
    "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=1200",
  ],
  art: [
    "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1200",
    "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=1200",
  ],
};

async function clean() {
  await prisma.otpCode.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.supportCategory.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.cancellationRequest.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.instructor.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.authSession.deleteMany();
  await prisma.user.deleteMany();
}

async function seedTaxonomy() {
  let subcategoryIndex = 1;
  for (const [categoryIndex, item] of DEFAULT_TAXONOMY.entries()) {
    const category = await prisma.category.create({
      data: {
        categoryCode: `CAT-${String(categoryIndex + 1).padStart(3, "0")}`,
        name: item.name,
        icon: item.icon,
        hue: item.hue,
        displayOrder: categoryIndex,
      },
    });

    for (const [displayOrder, name] of item.subcategories.entries()) {
      await prisma.subcategory.create({
        data: {
          subcategoryCode: `SUB-${String(subcategoryIndex).padStart(3, "0")}`,
          categoryId: category.id,
          name,
          displayOrder,
        },
      });
      subcategoryIndex += 1;
    }
  }
}

async function seedSupportCategories() {
  for (const [displayOrder, name] of DEFAULT_SUPPORT_CATEGORIES.entries()) {
    await prisma.supportCategory.create({
      data: { name, displayOrder },
    });
  }
}

async function main() {
  console.log("🌱 Seeding LearnNextDoor…");
  await clean();
  await seedTaxonomy();
  await seedSupportCategories();

  // --- Users & Providers ---
  const providers = [
    {
      code: "P001",
      userName: "Sunita Kapoor",
      phone: "+919810000001",
      email: "sunita@nritya.com",
      institute: "Nritya Academy",
      bio: "Award-winning classical & contemporary dance school in Pitampura.",
      area: "Pitampura, Delhi",
      address: "B-22, DDA Flats, Sector 14, Rohini, Delhi",
      upiId: "sunita@okicici",
      kyc: "VERIFIED" as const,
      kycDoc: "Aadhaar",
    },
    {
      code: "P002",
      userName: "Rohit Verma",
      phone: "+919810000002",
      email: "rohit@codecraft.in",
      institute: "CodeCraft Institute",
      bio: "Project-based coding bootcamps for teens and working professionals.",
      area: "Pitampura, Delhi",
      address: "C-14, Community Center, Pitampura, Delhi",
      upiId: "rohit@okhdfcbank",
      kyc: "VERIFIED" as const,
      kycDoc: "PAN",
    },
    {
      code: "P003",
      userName: "Anita Desai",
      phone: "+919810000003",
      email: "anita@claystudio.in",
      institute: "Clay Studio Bangalore",
      bio: "A warm, light-filled pottery studio tucked inside a Rohini colony.",
      area: "Rohini, Delhi",
      address: "D-8, Pocket 7, Sector 23, Rohini, Delhi",
      upiId: "anita@ybl",
      kyc: "VERIFIED" as const,
      kycDoc: "Aadhaar",
    },
    {
      code: "P004",
      userName: "Manish Gupta",
      phone: "+919810000004",
      email: "manish@mindspark.in",
      institute: "MindSpark Academy",
      bio: "Chess and mental-math coaching since 2011.",
      area: "Pitampura, Delhi",
      address: "Ring Road, Pitampura, Delhi",
      upiId: "manish@okaxis",
      kyc: "PENDING" as const,
      kycDoc: null,
    },
    {
      code: "P005",
      userName: "Tara Mehra",
      phone: "+919810000005",
      email: "tara@cucina.in",
      institute: "Cucina Kitchen",
      bio: "A tiny home kitchen teaching big Italian flavours.",
      area: "Rajouri Garden, Delhi",
      address: "A-4, Rajouri Garden, Delhi",
      upiId: "tara@okicici",
      kyc: "VERIFIED" as const,
      kycDoc: "Aadhaar",
    },
    {
      code: "P006",
      userName: "Ravi Nair",
      phone: "+919810000006",
      email: "ravi@strings.in",
      institute: "Strings Academy",
      bio: "Guitar & piano lessons — ages 8 to 80.",
      area: "Pitampura, Delhi",
      address: "Madhuban Chowk, Pitampura, Delhi",
      upiId: "ravi@ybl",
      kyc: "VERIFIED" as const,
      kycDoc: "PAN",
    },
    {
      code: "P007",
      userName: "Zoya Khan",
      phone: "+919810000007",
      email: "zoya@innerpeace.in",
      institute: "Inner Peace Studio",
      bio: "Gentle yoga and guided meditation in a sunlit studio.",
      area: "Pitampura, Delhi",
      address: "Netaji Subhash Place, Pitampura, Delhi",
      upiId: "zoya@okhdfcbank",
      kyc: "VERIFIED" as const,
      kycDoc: "Aadhaar",
    },
    {
      code: "P008",
      userName: "Kavita Arora",
      phone: "+919810000008",
      email: "kavita@canvascorner.in",
      institute: "Canvas Corner",
      bio: "Watercolour, acrylic and mixed-media art for every age.",
      area: "Pitampura, Delhi",
      address: "Ring Road, Pitampura, Delhi",
      upiId: "kavita@okaxis",
      kyc: "NOT_UPLOADED" as const,
      kycDoc: null,
    },
  ];

  const createdProviders: Record<string, any> = {};
  for (const p of providers) {
    const user = await prisma.user.create({
      data: {
        name: p.userName,
        phone: p.phone,
        email: p.email,
        role: "PROVIDER",
      },
    });
    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        providerCode: p.code,
        instituteName: p.institute,
        bio: p.bio,
        area: p.area,
        address: p.address,
        upiId: p.upiId,
        upiVerified: p.kyc === "VERIFIED",
        kycStatus: p.kyc,
        kycDocType: p.kycDoc,
        kycVerifiedAt: p.kyc === "VERIFIED" ? new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) : null,
      },
    });
    createdProviders[p.code] = { user, provider };
  }

  // --- Instructors ---
  const instructors = [
    { provider: "P001", name: "Meera Sharma", specialty: "Bharatanatyam · 12 years", kyc: "VERIFIED" as const, email: "meera@nritya.com", phone: "+919820000001" },
    { provider: "P006", name: "Rahul Kapoor", specialty: "Classical & Spanish guitar", kyc: "VERIFIED" as const, email: "rahul@strings.in", phone: "+919820000002" },
    { provider: "P003", name: "Anita Desai", specialty: "Hand-built pottery", kyc: "PENDING" as const, email: "anita2@claystudio.in", phone: "+919820000003" },
    { provider: "P002", name: "Vikram Singh", specialty: "Full-stack web development", kyc: "NOT_UPLOADED" as const, email: "vikram@codecraft.in", phone: "+919820000004" },
    { provider: "P007", name: "Aarav Nanda", specialty: "Hatha Yoga & Pranayama", kyc: "VERIFIED" as const, email: "aarav@innerpeace.in", phone: "+919820000005" },
    { provider: "P004", name: "Sandeep Jain", specialty: "Chess (FIDE rated)", kyc: "VERIFIED" as const, email: "sandeep@mindspark.in", phone: "+919820000006" },
    { provider: "P005", name: "Tara Mehra", specialty: "Italian cuisine", kyc: "VERIFIED" as const, email: "tara2@cucina.in", phone: "+919820000007" },
    { provider: "P008", name: "Kavita Arora", specialty: "Watercolour & mixed media", kyc: "NOT_UPLOADED" as const, email: "kavita2@canvascorner.in", phone: "+919820000008" },
  ];

  const insByProvider: Record<string, any[]> = {};
  for (const i of instructors) {
    const inst = await prisma.instructor.create({
      data: {
        providerId: createdProviders[i.provider].provider.id,
        name: i.name,
        specialty: i.specialty,
        email: i.email,
        phone: i.phone,
        kycStatus: i.kyc,
      },
    });
    (insByProvider[i.provider] ||= []).push(inst);
  }

  // --- Classes + batches ---
  type ClassSeed = {
    provider: string;
    title: string;
    type: "REGULAR" | "COURSE" | "WORKSHOP";
    category: string;
    description: string;
    tags: string;
    images: string[];
    earlyBird?: boolean;
    startDate?: Date;
    durationWeeks?: number;
    rating?: number;
    reviews?: number;
    batches: {
      name: string;
      days: string;
      from: string;
      to: string;
      price: number;
      max: number;
      enrolled: number;
      freeTrial?: boolean;
      trialSessions?: number;
    }[];
  };

  const classesSeed: ClassSeed[] = [
    {
      provider: "P001",
      title: "Classical Bharatanatyam",
      type: "REGULAR",
      category: "Dance",
      description:
        "Learn the traditional form of Bharatanatyam from a certified guru. Suitable for complete beginners. Focus on posture, adavus, rhythm and expression.",
      tags: "classical,bharatanatyam,beginners",
      images: IMG.dance,
      rating: 4.9,
      reviews: 38,
      batches: [
        { name: "Morning Beginners", days: "Mon,Wed,Fri", from: "07:00", to: "08:00", price: 2500, max: 20, enrolled: 17, freeTrial: true, trialSessions: 1 },
        { name: "Evening Intermediate", days: "Tue,Thu", from: "18:00", to: "19:30", price: 3200, max: 15, enrolled: 12, freeTrial: true, trialSessions: 1 },
      ],
    },
    {
      provider: "P006",
      title: "Guitar Lessons for Beginners",
      type: "REGULAR",
      category: "Music",
      description:
        "From your first chord to your first song in 4 weeks. Learn chords, strumming patterns and basic music theory. Acoustic guitars provided for first-timers.",
      tags: "guitar,music,beginners",
      images: IMG.guitar,
      earlyBird: true,
      rating: 4.8,
      reviews: 29,
      batches: [
        { name: "Weekday Evenings", days: "Mon,Wed", from: "19:00", to: "20:00", price: 3000, max: 10, enrolled: 8, freeTrial: true, trialSessions: 1 },
        { name: "Weekend Batch", days: "Sat,Sun", from: "11:00", to: "12:30", price: 3500, max: 8, enrolled: 3, freeTrial: true, trialSessions: 1 },
      ],
    },
    {
      provider: "P003",
      title: "Weekend Pottery Workshop",
      type: "WORKSHOP",
      category: "Art",
      description:
        "Spend a Saturday at our clay studio. Learn hand-building basics, shape two pieces, and take home your fired ceramic after 10 days.",
      tags: "pottery,handbuilding,weekend,adults",
      images: IMG.pottery,
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      rating: 4.7,
      reviews: 14,
      batches: [
        { name: "Saturday Session", days: "Sat", from: "10:00", to: "13:00", price: 1500, max: 12, enrolled: 9 },
      ],
    },
    {
      provider: "P002",
      title: "Full-Stack Web Development",
      type: "COURSE",
      category: "Coding",
      description:
        "Build & deploy 3 real projects using React, Node.js and PostgreSQL. 12 weeks of hands-on, cohort-based learning with 1:1 mentorship.",
      tags: "coding,react,node,fullstack",
      images: IMG.coding,
      earlyBird: true,
      durationWeeks: 12,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      rating: 4.8,
      reviews: 42,
      batches: [
        { name: "Cohort #7", days: "Tue,Thu,Sat", from: "19:00", to: "20:30", price: 18000, max: 25, enrolled: 22, freeTrial: true, trialSessions: 2 },
      ],
    },
    {
      provider: "P007",
      title: "Morning Yoga & Meditation",
      type: "REGULAR",
      category: "Yoga",
      description:
        "Gentle Hatha yoga and 10-minute guided meditation to start your day. All levels welcome. Mats available.",
      tags: "yoga,meditation,morning,beginner",
      images: IMG.yoga,
      rating: 4.9,
      reviews: 57,
      batches: [
        { name: "Daily Morning", days: "Mon,Tue,Wed,Thu,Fri,Sat", from: "06:30", to: "07:30", price: 2000, max: 25, enrolled: 24, freeTrial: true, trialSessions: 2 },
      ],
    },
    {
      provider: "P004",
      title: "Chess for Kids (Ages 7–12)",
      type: "REGULAR",
      category: "Chess",
      description:
        "Weekly coaching to build strategic thinking. Kids learn openings, tactics, and play practice matches with coaches.",
      tags: "chess,kids,strategy",
      images: IMG.chess,
      rating: 4.7,
      reviews: 19,
      batches: [
        { name: "Weekday Evenings", days: "Tue,Thu", from: "17:00", to: "18:00", price: 1800, max: 15, enrolled: 11, freeTrial: true, trialSessions: 1 },
      ],
    },
    {
      provider: "P005",
      title: "Italian Cooking Masterclass",
      type: "COURSE",
      category: "Cooking",
      description:
        "Over 4 weeks, you'll cook 8 Italian classics from scratch — fresh pasta, risotto, focaccia and more. Ingredients included.",
      tags: "cooking,italian,pasta,adults",
      images: IMG.cooking,
      durationWeeks: 4,
      rating: 4.9,
      reviews: 22,
      batches: [
        { name: "Saturday Afternoons", days: "Sat", from: "14:00", to: "17:00", price: 12000, max: 10, enrolled: 5 },
      ],
    },
    {
      provider: "P008",
      title: "Watercolour for Beginners",
      type: "REGULAR",
      category: "Art",
      description:
        "Discover the joy of watercolour painting with weekly hands-on sessions. All materials provided for the first class.",
      tags: "watercolour,painting,art,beginners",
      images: IMG.art,
      earlyBird: true,
      rating: 4.6,
      reviews: 11,
      batches: [
        { name: "Weekend Mornings", days: "Sun", from: "10:00", to: "11:30", price: 2200, max: 12, enrolled: 4, freeTrial: true, trialSessions: 1 },
      ],
    },
  ];

  const createdClasses: Record<string, any> = {};
  for (const c of classesSeed) {
    const instructor = insByProvider[c.provider]?.[0];
    const cls = await prisma.class.create({
      data: {
        providerId: createdProviders[c.provider].provider.id,
        title: c.title,
        type: c.type,
        category: c.category,
        description: c.description,
        tagsCsv: c.tags,
        imagesCsv: c.images.join(","),
        earlyBird: !!c.earlyBird,
        startDate: c.startDate,
        durationWeeks: c.durationWeeks,
        rating: c.rating,
        reviewsCount: c.reviews ?? 0,
        status: "ACTIVE",
        liveStatus: "APPROVED",
        liveDecidedAt: new Date(),
        batches: {
          create: c.batches.map((b) => ({
            name: b.name,
            classDaysCsv: b.days,
            fromTime: b.from,
            toTime: b.to,
            pricePer4Weeks: b.price,
            maxStudents: b.max,
            enrolled: b.enrolled,
            freeTrialEnabled: !!b.freeTrial,
            freeTrialSessions: b.trialSessions ?? 0,
            instructorId: instructor?.id,
          })),
        },
      },
    });
    createdClasses[c.title] = cls;
  }

  // --- Sample student user ---
  const student = await prisma.user.create({
    data: {
      name: "Aryan Shenoy",
      phone: "+919999999999",
      email: "aryan@example.com",
      role: "STUDENT",
    },
  });

  // --- A few reviews ---
  const classForReview = await prisma.class.findFirst({ where: { title: "Classical Bharatanatyam" } });
  if (classForReview) {
    await prisma.review.createMany({
      data: [
        { classId: classForReview.id, userId: student.id, rating: 5, comment: "Meera ma'am is incredible. My daughter looks forward to every class." },
      ],
    });
  }

  // --- Settlements for the Nritya Academy provider ---
  const nritya = createdProviders["P001"].provider;
  const s1Start = new Date();
  s1Start.setMonth(s1Start.getMonth() - 1);
  s1Start.setDate(1);
  const s1End = new Date(s1Start);
  s1End.setMonth(s1End.getMonth() + 1);
  s1End.setDate(0);
  const s2Start = new Date(s1Start);
  s2Start.setMonth(s2Start.getMonth() - 1);
  const s2End = new Date(s2Start);
  s2End.setMonth(s2End.getMonth() + 1);
  s2End.setDate(0);

  // Build next-month window for a FUTURE settlement
  const sNextStart = new Date();
  sNextStart.setDate(1);
  sNextStart.setMonth(sNextStart.getMonth() + 1);
  const sNextEnd = new Date(sNextStart);
  sNextEnd.setMonth(sNextEnd.getMonth() + 1);
  sNextEnd.setDate(0);

  await prisma.settlement.createMany({
    data: [
      {
        providerId: nritya.id,
        code: "s1",
        periodStart: s1Start,
        periodEnd: s1End,
        gross: 72000,
        commission: 7200,
        net: 64800,
        status: "PAID",
        utr: "412309876001",
        paidAt: new Date(s1End.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        providerId: nritya.id,
        code: "s2",
        periodStart: s2Start,
        periodEnd: s2End,
        gross: 58000,
        commission: 5800,
        net: 52200,
        status: "PAID",
        utr: "412309876002",
        paidAt: new Date(s2End.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        providerId: nritya.id,
        code: "s3",
        periodStart: s1Start,
        periodEnd: s1End,
        gross: 41500,
        commission: 4150,
        net: 37350,
        status: "FAILED",
        notes: "UPI transaction bounced — provider needs to re-verify UPI ID.",
      },
      {
        providerId: nritya.id,
        code: "s4",
        periodStart: s2Start,
        periodEnd: s2End,
        gross: 28400,
        commission: 2840,
        net: 25560,
        status: "PENDING",
      },
      {
        providerId: nritya.id,
        code: "s5",
        periodStart: new Date(),
        periodEnd: new Date(),
        gross: 32500,
        commission: 3250,
        net: 29250,
        status: "PROCESSING",
      },
      {
        providerId: nritya.id,
        code: "s6",
        periodStart: sNextStart,
        periodEnd: sNextEnd,
        gross: 0,
        commission: 0,
        net: 0,
        status: "FUTURE",
      },
    ],
  });

  // --- Notifications for Nritya Academy provider (user-level) ---
  await prisma.notification.createMany({
    data: [
      {
        userId: createdProviders["P001"].user.id,
        type: "NEW_ENROLLMENT",
        title: "New enrollment",
        body: "Priya Gupta enrolled in Classical Bharatanatyam (Morning Beginners).",
      },
      {
        userId: createdProviders["P001"].user.id,
        type: "NEW_ENROLLMENT",
        title: "New enrollment",
        body: "Rahul Mehta booked a free trial for Classical Bharatanatyam.",
        read: true,
      },
      {
        userId: createdProviders["P001"].user.id,
        type: "SETTLEMENT_PROCESSED",
        title: "Payout processed",
        body: "₹64,800 sent to your UPI for last month's classes (s1).",
      },
      {
        userId: createdProviders["P001"].user.id,
        type: "KYC_APPROVED",
        title: "KYC approved",
        body: "Your Aadhaar was verified. You can now accept bookings.",
        read: true,
      },
      {
        userId: createdProviders["P001"].user.id,
        type: "EARLY_BIRD_SOLD_OUT",
        title: "Early-bird sold out",
        body: "All early-bird spots for Evening Intermediate are booked.",
      },
      {
        userId: createdProviders["P001"].user.id,
        type: "SUPPORT_TICKET_UPDATE",
        title: "Ticket T001 updated",
        body: "Your payout delay query has been resolved.",
      },
    ],
  });

  // --- Support tickets ---
  const resolvedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
  const overdueCreated = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  await prisma.supportTicket.createMany({
    data: [
      {
        userId: createdProviders["P001"].user.id,
        code: "T001",
        subject: "Payout for January delayed",
        category: "Payouts",
        message:
          "Last month's payout didn't arrive on the 2nd as expected. Can someone confirm when it will be released?",
        reply:
          "Hi Sunita — we found the delay on our side and processed it manually today. Expect funds in 24h.",
        resolutionNote:
          "Investigated NEFT queue, found stuck batch, reprocessed manually. UTR 412309000041 confirmed delivered.",
        resolvedAt,
        deleteAfter: new Date(resolvedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "RESOLVED",
      },
      {
        userId: createdProviders["P001"].user.id,
        code: "T002",
        subject: "Can I pause a batch for 2 weeks?",
        category: "Classes",
        message:
          "I'm travelling for a performance; is there a way to pause billing for enrolled students?",
        status: "OPEN",
      },
      {
        userId: createdProviders["P001"].user.id,
        code: "T003",
        subject: "Student showing wrong batch in dashboard",
        category: "Classes",
        message:
          "One of my enrolled students (Priya G.) is showing up in the wrong batch in my provider dashboard — please investigate urgently.",
        status: "OPEN",
        createdAt: overdueCreated,
      },
    ],
  });

  // --- Sample holiday ---
  const holi = new Date();
  holi.setMonth(holi.getMonth() + 1);
  holi.setDate(15);
  await prisma.holiday.create({
    data: {
      providerId: nritya.id,
      date: holi,
      reason: "Annual recital preparation",
      affectsAll: true,
    },
  });

  console.log("✅ Seed complete.");
  console.log(`   ${providers.length} providers, ${instructors.length} instructors, ${classesSeed.length} classes seeded.`);
  console.log("   Login as student (Email OTP):  aryan@example.com");
  console.log("   Login as provider (Email OTP): sunita@nritya.com   (Sunita, Nritya Academy)");
  console.log("   OTPs print to the server console in dev mode, or are emailed via Resend when RESEND_API_KEY is set.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
