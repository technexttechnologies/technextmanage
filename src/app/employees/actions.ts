"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { hashPassword, getSession } from "@/lib/auth";

// Check if user is Admin or HR
async function requireAdminOrHR() {
  const session = await getSession();
  const allowed = ["SUPER_ADMIN", "ADMIN", "HR", "HEAD"];
  if (!session || !allowed.includes(session.role as string)) {
    throw new Error("Unauthorized: Administrator or HR privilege required.");
  }
  return session;
}

// Check logged in user
async function requireAuth() {
  const session = await getSession();
  if (!session?.userId) {
    throw new Error("Unauthorized: Please sign in.");
  }
  return session;
}

// ==================== EMPLOYEE CRUD ACTIONS ====================

export async function createEmployee(formData: FormData) {
  await requireAdminOrHR();

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  let employeeId = (formData.get("employeeId") as string)?.toUpperCase().trim();
  const role = (formData.get("role") as string) || "SALES";
  const designation = formData.get("designation") as string;
  const departmentId = formData.get("departmentId") as string;
  const employmentType = (formData.get("employmentType") as string) || "FULL_TIME";
  const shiftHours = (formData.get("shiftHours") as string) || "09:30 AM - 06:30 PM";
  const joiningDateStr = formData.get("joiningDate") as string;
  const salaryStr = formData.get("salary") as string;
  const emergencyContact = formData.get("emergencyContact") as string;
  const bloodGroup = formData.get("bloodGroup") as string;
  const address = formData.get("address") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    throw new Error("Employee full name, email, and password are required.");
  }

  // Auto-generate employeeId if not provided
  if (!employeeId) {
    const count = await prisma.user.count();
    employeeId = `TNT-${String(count + 101).padStart(3, "0")}`;
  }

  // Check unique constraints
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new Error(`Email address ${email} is already in use.`);
  }

  const existingEmpId = await prisma.user.findFirst({ where: { employeeId } });
  if (existingEmpId) {
    throw new Error(`Employee ID ${employeeId} is already assigned.`);
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      employeeId,
      role,
      designation: designation || null,
      departmentId: departmentId || null,
      employmentType,
      shiftHours,
      joiningDate: joiningDateStr ? new Date(joiningDateStr) : new Date(),
      salary: salaryStr ? parseFloat(salaryStr) : null,
      emergencyContact: emergencyContact || null,
      bloodGroup: bloodGroup || null,
      address: address || null,
      passwordHash,
      isActive: true,
    },
  });

  revalidatePath("/employees");
  revalidatePath("/users");
  return { success: true };
}

export async function updateEmployee(formData: FormData) {
  await requireAdminOrHR();

  const userId = formData.get("userId") as string;
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  const employeeId = (formData.get("employeeId") as string)?.toUpperCase().trim();
  const role = formData.get("role") as string;
  const designation = formData.get("designation") as string;
  const departmentId = formData.get("departmentId") as string;
  const employmentType = formData.get("employmentType") as string;
  const shiftHours = formData.get("shiftHours") as string;
  const joiningDateStr = formData.get("joiningDate") as string;
  const salaryStr = formData.get("salary") as string;
  const emergencyContact = formData.get("emergencyContact") as string;
  const bloodGroup = formData.get("bloodGroup") as string;
  const address = formData.get("address") as string;
  const isActive = formData.get("isActive") === "true";

  if (!userId || !name || !email || !role) {
    throw new Error("Missing required fields.");
  }

  // Verify email conflict
  const emailConflict = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (emailConflict) {
    throw new Error(`Email ${email} is already used by another account.`);
  }

  // Verify employeeId conflict
  if (employeeId) {
    const idConflict = await prisma.user.findFirst({
      where: { employeeId, NOT: { id: userId } },
    });
    if (idConflict) {
      throw new Error(`Employee ID ${employeeId} is already in use.`);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      email,
      phone: phone || null,
      employeeId: employeeId || null,
      role,
      designation: designation || null,
      departmentId: departmentId || null,
      employmentType: employmentType || "FULL_TIME",
      shiftHours: shiftHours || "09:30 AM - 06:30 PM",
      joiningDate: joiningDateStr ? new Date(joiningDateStr) : undefined,
      salary: salaryStr ? parseFloat(salaryStr) : undefined,
      emergencyContact: emergencyContact || null,
      bloodGroup: bloodGroup || null,
      address: address || null,
      isActive,
    },
  });

  revalidatePath("/employees");
  revalidatePath("/users");
  return { success: true };
}

export async function resetEmployeePassword(formData: FormData) {
  await requireAdminOrHR();

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword || newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters.");
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/employees");
  revalidatePath("/users");
  return { success: true };
}

export async function toggleEmployeeStatus(userId: string, currentStatus: boolean) {
  await requireAdminOrHR();

  if (!userId) throw new Error("Missing user ID");

  await prisma.user.update({
    where: { id: userId },
    data: { isActive: !currentStatus },
  });

  revalidatePath("/employees");
  revalidatePath("/users");
  return { success: true, newStatus: !currentStatus };
}

export async function deleteEmployee(formData: FormData) {
  await requireAdminOrHR();

  const userId = formData.get("userId") as string;
  if (!userId) throw new Error("Missing user ID");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.role === "SUPER_ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "SUPER_ADMIN" } });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the only Super Administrator account.");
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/employees");
  revalidatePath("/users");
  return { success: true };
}

// ==================== ATTENDANCE ACTIONS ====================

export async function clockIn(notes?: string) {
  const session = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Late if after 09:45 AM
  const isLate = currentHour > 9 || (currentHour === 9 && currentMinute > 45);
  const status = isLate ? "LATE" : "PRESENT";

  await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId: session.userId as string,
        date: today,
      },
    },
    update: {
      clockIn: now,
      status,
      notes: notes || undefined,
    },
    create: {
      userId: session.userId as string,
      date: today,
      clockIn: now,
      status,
      notes: notes || null,
    },
  });

  revalidatePath("/employees/portal");
  revalidatePath("/employees/attendance");
  revalidatePath("/hr/attendance");
  return { success: true };
}

export async function clockOut() {
  const session = await requireAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId: session.userId as string,
        date: today,
      },
    },
  });

  if (!existing) {
    throw new Error("Cannot clock out before clocking in.");
  }

  await prisma.attendance.update({
    where: { id: existing.id },
    data: { clockOut: new Date() },
  });

  revalidatePath("/employees/portal");
  revalidatePath("/employees/attendance");
  revalidatePath("/hr/attendance");
  return { success: true };
}

export async function recordManualAttendance(formData: FormData) {
  await requireAdminOrHR();

  const userId = formData.get("userId") as string;
  const dateStr = formData.get("date") as string;
  const clockInTimeStr = formData.get("clockInTime") as string;
  const clockOutTimeStr = formData.get("clockOutTime") as string;
  const status = (formData.get("status") as string) || "PRESENT";
  const notes = formData.get("notes") as string;

  if (!userId || !dateStr) {
    throw new Error("Employee and date are required.");
  }

  const attendanceDate = new Date(dateStr);
  attendanceDate.setHours(0, 0, 0, 0);

  const clockInDate = new Date(`${dateStr}T${clockInTimeStr || "09:30:00"}`);
  const clockOutDate = clockOutTimeStr ? new Date(`${dateStr}T${clockOutTimeStr}`) : null;

  await prisma.attendance.upsert({
    where: {
      userId_date: {
        userId,
        date: attendanceDate,
      },
    },
    update: {
      clockIn: clockInDate,
      clockOut: clockOutDate,
      status,
      notes: notes || null,
    },
    create: {
      userId,
      date: attendanceDate,
      clockIn: clockInDate,
      clockOut: clockOutDate,
      status,
      notes: notes || null,
    },
  });

  revalidatePath("/employees/attendance");
  revalidatePath("/hr/attendance");
  return { success: true };
}

// ==================== LEAVE MANAGEMENT ACTIONS ====================

export async function submitLeaveRequest(formData: FormData) {
  const session = await requireAuth();

  const type = (formData.get("type") as string) || "CASUAL";
  const startDateStr = formData.get("startDate") as string;
  const endDateStr = formData.get("endDate") as string;
  const reason = formData.get("reason") as string;

  if (!startDateStr || !endDateStr || !reason) {
    throw new Error("Start date, end date, and reason are required.");
  }

  await prisma.leaveRequest.create({
    data: {
      userId: session.userId as string,
      type,
      startDate: new Date(startDateStr),
      endDate: new Date(endDateStr),
      reason,
      status: "PENDING",
    },
  });

  revalidatePath("/employees/portal");
  revalidatePath("/employees/leaves");
  revalidatePath("/hr/leaves");
  return { success: true };
}

export async function reviewLeaveRequest(
  leaveId: string, 
  status: "APPROVED" | "REJECTED", 
  adminNotes?: string
) {
  const session = await requireAdminOrHR();

  if (!leaveId || !status) {
    throw new Error("Missing leave review details.");
  }

  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: {
      status,
      adminNotes: adminNotes || null,
      reviewedById: session.userId as string,
    },
  });

  revalidatePath("/employees/leaves");
  revalidatePath("/employees/portal");
  revalidatePath("/hr/leaves");
  return { success: true };
}
