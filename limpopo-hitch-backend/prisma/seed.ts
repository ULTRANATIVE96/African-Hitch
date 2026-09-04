import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Limpopo Hitch database...");

  // Clear existing
  await prisma.comment.deleteMany();
  await prisma.appeal.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.flag.deleteMany();
  await prisma.rideRequest.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash("Password123!", 10);

  // 1. Create Drivers
  const driver1 = await prisma.user.create({
    data: {
      id: "usr_driver_1",
      name: "Tebogo Mabasa",
      role: "driver",
      phone: "+27 82 123 4567",
      email: "tebogo.mabasa@limpopohitch.co.za",
      password: defaultPassword,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
      rating: 4.9,
      completedRides: 48,
      vehicle: "Toyota Quantum Silver",
      plate: "LMP 892 NW",
      seats: 14,
      verified: true,
    },
  });

  const driver2 = await prisma.user.create({
    data: {
      id: "usr_driver_2",
      name: "Kgothatso Ndlovu",
      role: "driver",
      phone: "+27 71 987 6543",
      email: "kgothatso@limpopohitch.co.za",
      password: defaultPassword,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
      rating: 4.7,
      completedRides: 22,
      vehicle: "Volkswagen Polo White",
      plate: "LMP 104 GP",
      seats: 4,
      verified: true,
    },
  });

  // 2. Create Hikers
  const hiker1 = await prisma.user.create({
    data: {
      id: "usr_hiker_1",
      name: "Thabo Mokoena",
      role: "hiker",
      phone: "+27 76 543 2109",
      email: "thabo@limpopohitch.co.za",
      password: defaultPassword,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400",
      rating: 5.0,
      completedRides: 12,
      verified: true,
    },
  });

  const hiker2 = await prisma.user.create({
    data: {
      id: "usr_hiker_2",
      name: "Nthabiseng Ramokgopa",
      role: "hiker",
      phone: "+27 83 222 1100",
      email: "nthabiseng@limpopohitch.co.za",
      password: defaultPassword,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
      rating: 4.8,
      completedRides: 7,
      verified: true,
    },
  });

  const now = BigInt(Date.now());

  // 3. Create Posts
  const post1 = await prisma.post.create({
    data: {
      id: "post_1",
      authorId: driver1.id,
      role: "driver",
      fromLocation: "Polokwane Town Rank",
      toLocation: "Tzaneen Central",
      date: "2026-08-06",
      time: "07:30",
      pricePerSeat: 120,
      notes: "Leaving early morning via R71. 3 seats open. Safe driver, luggage space available.",
      seats: 3,
      open: true,
      createdAt: now - BigInt(3600000),
    },
  });

  const post2 = await prisma.post.create({
    data: {
      id: "post_2",
      authorId: hiker1.id,
      role: "hiker",
      fromLocation: "Mokopane BP Garage N1",
      toLocation: "Polokwane Mall of the North",
      date: "2026-08-06",
      time: "09:00",
      pricePerSeat: 80,
      notes: "Hiker looking for a ride with 1 backpack. Happy to contribute fuel costs.",
      passengers: 1,
      luggage: "Medium backpack",
      open: true,
      createdAt: now - BigInt(7200000),
    },
  });

  const post3 = await prisma.post.create({
    data: {
      id: "post_3",
      authorId: driver2.id,
      role: "driver",
      fromLocation: "Polokwane Indian Centre",
      toLocation: "Thohoyandou Plaza",
      date: "2026-08-07",
      time: "14:00",
      pricePerSeat: 180,
      notes: "Air-conditioned car, clean ride. Stopping at Giyani turnoff on request.",
      seats: 2,
      open: true,
      createdAt: now - BigInt(1800000),
    },
  });

  // 4. Create Ride Requests
  await prisma.rideRequest.create({
    data: {
      id: "req_1",
      postId: post1.id,
      fromUserId: hiker2.id,
      toUserId: driver1.id,
      status: "accepted",
      pickupPoint: "Polokwane Town Rank",
      createdAt: now - BigInt(1800000),
    },
  });

  // 5. Create Reviews
  await prisma.review.create({
    data: {
      id: "rev_1",
      driverId: driver1.id,
      authorId: hiker1.id,
      rating: 5,
      comment: "Tebogo is very punctual and driving was smooth along R71!",
      createdAt: now - BigInt(86400000),
    },
  });

  // 6. Create Comments
  await prisma.comment.create({
    data: {
      id: "cmt_1",
      postId: post1.id,
      authorId: hiker2.id,
      text: "Hi Tebogo, can you pick me up near BP Garage on N1?",
      createdAt: now - BigInt(2500000),
    },
  });

  console.log("✅ Limpopo Hitch database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
