import { NextResponse } from "next/server";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { provider } = await requireProvider();
  const body = await req.json();
  const {
    type,
    title,
    category,
    subcategory,
    description,
    tagsCsv,
    imagesCsv,
    address,
    landmark,
    earlyBird,
    earlyBirdEndDate,
    earlyBirdPrice,
    earlyBirdSlots,
    registrationEndDate,
    startDate,
    endDate,
    durationWeeks,
    batches,
  } = body ?? {};

  if (!["PENDING", "VERIFIED"].includes(provider.kycStatus)) {
    return NextResponse.json({ error: "Complete KYC before creating a listing." }, { status: 403 });
  }

  // Verified providers go live immediately; PENDING providers wait for admin KYC approval
  const isVerified = provider.kycStatus === "VERIFIED";
  const liveStatus = isVerified ? "APPROVED" : "PENDING_APPROVAL";
  const liveDecidedAt = isVerified ? new Date() : null;

  if (!title || String(title).trim().length < 3 || !type || !category) {
    return NextResponse.json({ error: "title, type and category are required" }, { status: 400 });
  }
  if (!["REGULAR", "COURSE", "WORKSHOP"].includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  if (!description || String(description).trim().length < 50) {
    return NextResponse.json({ error: "Description must be at least 50 characters." }, { status: 400 });
  }
  if (!address || !landmark) {
    return NextResponse.json({ error: "Address and landmark are required." }, { status: 400 });
  }
  const images = String(imagesCsv ?? "").split(",").map((item) => item.trim()).filter(Boolean);
  if (images.length < 3 || images.length > 5) {
    return NextResponse.json({ error: "Add 3 to 5 listing images." }, { status: 400 });
  }
  if (!Array.isArray(batches) || batches.length === 0) {
    return NextResponse.json({ error: "At least one batch is required" }, { status: 400 });
  }
  if (type === "REGULAR" && batches.length > 5) {
    return NextResponse.json({ error: "Regular classes can have up to 5 batches." }, { status: 400 });
  }
  if (type !== "REGULAR") {
    if (!registrationEndDate || !startDate) {
      return NextResponse.json({ error: "Registration end date and start date are required." }, { status: 400 });
    }
    if (type === "COURSE" && !endDate) {
      return NextResponse.json({ error: "Course end date is required." }, { status: 400 });
    }
  }

  const instructorIds = batches.map((b: any) => b.instructorId).filter(Boolean);
  if (instructorIds.length !== batches.length) {
    return NextResponse.json({ error: "Instructor is required for every batch." }, { status: 400 });
  }
  const ownedInstructorCount = await prisma.instructor.count({
    where: { providerId: provider.id, id: { in: instructorIds } },
  });
  if (ownedInstructorCount !== new Set(instructorIds).size) {
    return NextResponse.json({ error: "One or more instructors were not found." }, { status: 400 });
  }

  for (const b of batches) {
    if (!b.name || String(b.name).trim().length < 3) {
      return NextResponse.json({ error: "Batch name must be at least 3 characters." }, { status: 400 });
    }
    if (type === "REGULAR" && !b.startDate) {
      return NextResponse.json({ error: "Each regular batch needs a start date." }, { status: 400 });
    }
    if (type !== "WORKSHOP" && !b.classDaysCsv) {
      return NextResponse.json({ error: "Class days are required." }, { status: 400 });
    }
    if (!b.fromTime || !b.toTime || b.toTime <= b.fromTime) {
      return NextResponse.json({ error: "End time must be after start time." }, { status: 400 });
    }
    if (Number(b.pricePer4Weeks) < 100 || Number(b.maxStudents) < 1) {
      return NextResponse.json({ error: "Price and capacity are invalid." }, { status: 400 });
    }
    if (b.freeTrialEnabled && (Number(b.freeTrialSessions) < 1 || Number(b.freeTrialSessions) > 3)) {
      return NextResponse.json({ error: "Free trial sessions must be between 1 and 3." }, { status: 400 });
    }
  }

  const standardPrice = Math.min(...batches.map((b: any) => Number(b.pricePer4Weeks)).filter((n: number) => n > 0));
  if (earlyBird) {
    if (type === "REGULAR") {
      return NextResponse.json({ error: "Early bird pricing is only available for courses and workshops." }, { status: 400 });
    }
    if (!earlyBirdEndDate || Number(earlyBirdPrice) < 100 || Number(earlyBirdPrice) >= standardPrice || Number(earlyBirdSlots) < 1) {
      return NextResponse.json({ error: "Early bird pricing details are invalid." }, { status: 400 });
    }
  }

  const cls = await prisma.class.create({
    data: {
      providerId: provider.id,
      title,
      type,
      category,
      subcategory: subcategory ?? null,
      description: description ?? null,
      tagsCsv: tagsCsv ?? null,
      imagesCsv: imagesCsv ?? null,
      address: address ?? null,
      landmark: landmark ?? null,
      earlyBird: !!earlyBird,
      earlyBirdEndDate: earlyBirdEndDate ? new Date(earlyBirdEndDate) : null,
      earlyBirdPrice: earlyBirdPrice ? Number(earlyBirdPrice) : null,
      earlyBirdSlots: earlyBirdSlots ? Number(earlyBirdSlots) : null,
      registrationEndDate: registrationEndDate ? new Date(registrationEndDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      durationWeeks: durationWeeks ?? null,
      status: "ACTIVE",
      liveStatus,
      liveDecidedAt,
      batches: {
        create: batches.map((b: any) => ({
          name: b.name || "Default batch",
          classDaysCsv: b.classDaysCsv ?? "",
          startDate: b.startDate ? new Date(b.startDate) : null,
          fromTime: b.fromTime ?? "09:00",
          toTime: b.toTime ?? "10:00",
          pricePer4Weeks: Number(b.pricePer4Weeks ?? 0),
          maxStudents: Number(b.maxStudents ?? 20),
          freeTrialEnabled: !!b.freeTrialEnabled,
          freeTrialSessions: Number(b.freeTrialSessions ?? 0),
          instructorId: b.instructorId || null,
          imageUrl: b.imageUrl || null,
        })),
      },
    },
  });

  return NextResponse.json({ ok: true, class: cls });
}
