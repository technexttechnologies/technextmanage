"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";

async function requireFacultyOrAdmin() {
  const session = await getSession();
  const allowed = ["FACULTY", "SUPER_ADMIN", "ADMIN", "HEAD"];
  if (!session || !allowed.includes(session.role as string)) {
    throw new Error("Unauthorized: Faculty or Admin access required.");
  }
  return session;
}

// ==================== SEED / INITIALIZE DEMO DATA ====================
export async function seedDemoFacultyData() {
  const session = await requireFacultyOrAdmin();

  const existingCourses = await prisma.course.count();
  if (existingCourses > 0) return { success: true, message: "Data already initialized" };

  // 1. Create Courses
  const mernCourse = await prisma.course.create({
    data: {
      title: "Full Stack Web Development (MERN)",
      code: "FSWD-2026",
      category: "Software Development",
      duration: "6 Months",
      description: "Master modern web development with MongoDB, Express.js, React, Node.js, Next.js, and TypeScript.",
      syllabus: "Module 1: HTML5/CSS3/Tailwind\nModule 2: JavaScript ES6+ & TypeScript\nModule 3: React 19 & Next.js App Router\nModule 4: Node.js, Express & REST APIs\nModule 5: PostgreSQL & MongoDB\nModule 6: Cloud Deployment & DevOps",
    },
  });

  const pythonCourse = await prisma.course.create({
    data: {
      title: "Python, AI & Machine Learning Specialization",
      code: "PY-AI-501",
      category: "Artificial Intelligence",
      duration: "4 Months",
      description: "Comprehensive hands-on training in Python programming, NumPy, Pandas, Scikit-Learn, TensorFlow, and LLM integrations.",
      syllabus: "Module 1: Advanced Python\nModule 2: Data Analysis & Visualization\nModule 3: Machine Learning Algorithms\nModule 4: Deep Learning & Neural Networks\nModule 5: Generative AI & Gemini API",
    },
  });

  const flutterCourse = await prisma.course.create({
    data: {
      title: "Cross-Platform Mobile App Dev (Flutter & Dart)",
      code: "FLTR-301",
      category: "Mobile Development",
      duration: "3 Months",
      description: "Build beautiful, high-performance native iOS & Android applications from a single codebase using Flutter.",
      syllabus: "Module 1: Dart Fundamentals\nModule 2: Flutter Widgets & State Management\nModule 3: REST API Integration\nModule 4: Firebase Authentication & Cloud Firestore\nModule 5: App Store & Play Store Deployment",
    },
  });

  // 2. Create Sample Batches
  const batch1 = await prisma.facultyBatch.create({
    data: {
      name: "MERN Stack - Morning Elite Batch",
      batchCode: "FSWD-B1-AM",
      courseId: mernCourse.id,
      facultyId: session.userId as string,
      startDate: new Date(),
      schedule: "Mon - Fri, 09:30 AM - 12:30 PM",
      mode: "HYBRID",
      status: "ONGOING",
      classroom: "TechNext Lab 1 / Google Meet",
    },
  });

  const batch2 = await prisma.facultyBatch.create({
    data: {
      name: "Python & AI Bootcamp - Evening",
      batchCode: "PYAI-B2-PM",
      courseId: pythonCourse.id,
      facultyId: session.userId as string,
      startDate: new Date(),
      schedule: "Mon - Fri, 02:00 PM - 05:00 PM",
      mode: "OFFLINE",
      status: "ONGOING",
      classroom: "AI Center - Hall B",
    },
  });

  // 3. Create Sample Students for Batch 1
  const studentData = [
    { name: "Rahul Sharma", email: "rahul.s@technext.edu", phone: "+91 98461 22334", rollNo: "TN-2026-001" },
    { name: "Ananya Nair", email: "ananya.n@technext.edu", phone: "+91 94471 88990", rollNo: "TN-2026-002" },
    { name: "Mohammed Farhan", email: "farhan.m@technext.edu", phone: "+91 97471 44556", rollNo: "TN-2026-003" },
    { name: "Sneha Varma", email: "sneha.v@technext.edu", phone: "+91 95621 11223", rollNo: "TN-2026-004" },
    { name: "Arjun Das", email: "arjun.d@technext.edu", phone: "+91 98951 66778", rollNo: "TN-2026-005" },
    { name: "Devika Menon", email: "devika.m@technext.edu", phone: "+91 96331 99001", rollNo: "TN-2026-006" },
  ];

  for (const s of studentData) {
    await prisma.student.create({
      data: {
        ...s,
        batchId: batch1.id,
        status: "ACTIVE",
      },
    });
  }

  // 4. Create an Assignment
  const assignment = await prisma.facultyAssignment.create({
    data: {
      title: "Build a Full-Stack Product Catalog with Next.js & Prisma",
      description: "Implement product listing, dynamic filtering, single product view, and order submission using Next.js App Router and Prisma ORM.",
      batchId: batch1.id,
      facultyId: session.userId as string,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
      attachmentUrl: "https://github.com/technexttechnologies",
    },
  });

  // 5. Create Study Materials
  await prisma.facultyMaterial.create({
    data: {
      title: "Next.js 16 App Router & Server Actions Deep Dive",
      description: "Comprehensive lecture slides covering Server Components, Server Actions, and Turbopack optimizations.",
      batchId: batch1.id,
      facultyId: session.userId as string,
      category: "SLIDES",
      fileUrl: "https://nextjs.org/docs",
    },
  });

  await prisma.facultyMaterial.create({
    data: {
      title: "Clean Code Architecture & Database Schema Boilerplate",
      description: "Standard repository starter template with TypeScript, Prisma, and PostgreSQL.",
      batchId: batch1.id,
      facultyId: session.userId as string,
      category: "CODE",
      fileUrl: "https://github.com/technexttechnologies/starter-kit",
    },
  });

  revalidatePath("/faculty");
  return { success: true };
}

// ==================== BATCH & COURSE ACTIONS ====================
export async function createCourse(formData: FormData) {
  await requireFacultyOrAdmin();

  const title = formData.get("title") as string;
  const code = (formData.get("code") as string)?.toUpperCase().trim();
  const duration = formData.get("duration") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const syllabus = formData.get("syllabus") as string;

  if (!title || !code || !duration) {
    throw new Error("Course title, code, and duration are required.");
  }

  await prisma.course.create({
    data: {
      title,
      code,
      duration,
      category: category || "Software Development",
      description: description || null,
      syllabus: syllabus || null,
    },
  });

  revalidatePath("/faculty/batches");
  return { success: true };
}

export async function createBatch(formData: FormData) {
  const session = await requireFacultyOrAdmin();

  const name = formData.get("name") as string;
  const batchCode = (formData.get("batchCode") as string)?.toUpperCase().trim();
  const courseId = formData.get("courseId") as string;
  const facultyId = (formData.get("facultyId") as string) || (session.userId as string);
  const startDateStr = formData.get("startDate") as string;
  const schedule = formData.get("schedule") as string;
  const mode = (formData.get("mode") as string) || "OFFLINE";
  const classroom = formData.get("classroom") as string;

  if (!name || !batchCode || !courseId || !startDateStr) {
    throw new Error("Batch name, code, course, and start date are required.");
  }

  await prisma.facultyBatch.create({
    data: {
      name,
      batchCode,
      courseId,
      facultyId,
      startDate: new Date(startDateStr),
      schedule: schedule || null,
      mode,
      classroom: classroom || null,
      status: "ONGOING",
    },
  });

  revalidatePath("/faculty");
  revalidatePath("/faculty/batches");
  return { success: true };
}

// ==================== STUDENT ACTIONS ====================
export async function createStudent(formData: FormData) {
  await requireFacultyOrAdmin();

  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  const rollNo = (formData.get("rollNo") as string)?.toUpperCase().trim();
  const batchId = formData.get("batchId") as string;
  const notes = formData.get("notes") as string;

  if (!name || !email || !phone || !rollNo || !batchId) {
    throw new Error("Student name, email, phone, roll number, and batch are required.");
  }

  await prisma.student.create({
    data: {
      name,
      email,
      phone,
      rollNo,
      batchId,
      notes: notes || null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/faculty");
  revalidatePath("/faculty/students");
  revalidatePath(`/faculty/batches/${batchId}`);
  return { success: true };
}

export async function updateStudent(formData: FormData) {
  await requireFacultyOrAdmin();

  const studentId = formData.get("studentId") as string;
  const name = formData.get("name") as string;
  const email = (formData.get("email") as string)?.toLowerCase().trim();
  const phone = formData.get("phone") as string;
  const rollNo = formData.get("rollNo") as string;
  const batchId = formData.get("batchId") as string;
  const status = formData.get("status") as string;

  if (!studentId || !name || !email || !phone) {
    throw new Error("Missing required student details.");
  }

  await prisma.student.update({
    where: { id: studentId },
    data: {
      name,
      email,
      phone,
      rollNo,
      batchId,
      status,
    },
  });

  revalidatePath("/faculty/students");
  return { success: true };
}

export async function deleteStudent(formData: FormData) {
  await requireFacultyOrAdmin();

  const studentId = formData.get("studentId") as string;
  if (!studentId) throw new Error("Missing student ID");

  await prisma.student.delete({
    where: { id: studentId },
  });

  revalidatePath("/faculty/students");
  return { success: true };
}

// ==================== ATTENDANCE ACTIONS ====================
export async function saveBatchAttendance(
  batchId: string,
  dateStr: string,
  records: Array<{ studentId: string; status: string; remarks?: string }>
) {
  await requireFacultyOrAdmin();

  if (!batchId || !dateStr || !records || records.length === 0) {
    throw new Error("Batch, date, and student records are required.");
  }

  const attendanceDate = new Date(dateStr);

  for (const item of records) {
    await prisma.studentAttendance.upsert({
      where: {
        studentId_batchId_date: {
          studentId: item.studentId,
          batchId,
          date: attendanceDate,
        },
      },
      update: {
        status: item.status,
        remarks: item.remarks || null,
      },
      create: {
        studentId: item.studentId,
        batchId,
        date: attendanceDate,
        status: item.status,
        remarks: item.remarks || null,
      },
    });
  }

  revalidatePath("/faculty");
  revalidatePath("/faculty/attendance");
  revalidatePath(`/faculty/batches/${batchId}`);
  return { success: true, count: records.length };
}

// ==================== ASSIGNMENT & GRADING ACTIONS ====================
export async function createAssignment(formData: FormData) {
  const session = await requireFacultyOrAdmin();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const batchId = formData.get("batchId") as string;
  const dueDateStr = formData.get("dueDate") as string;
  const maxMarks = parseInt(formData.get("maxMarks") as string, 10) || 100;
  const attachmentUrl = formData.get("attachmentUrl") as string;

  if (!title || !description || !batchId || !dueDateStr) {
    throw new Error("Title, description, batch, and due date are required.");
  }

  await prisma.facultyAssignment.create({
    data: {
      title,
      description,
      batchId,
      facultyId: session.userId as string,
      dueDate: new Date(dueDateStr),
      maxMarks,
      attachmentUrl: attachmentUrl || null,
    },
  });

  revalidatePath("/faculty");
  revalidatePath("/faculty/assignments");
  return { success: true };
}

export async function gradeSubmission(formData: FormData) {
  await requireFacultyOrAdmin();

  const submissionId = formData.get("submissionId") as string;
  const marksObtained = parseFloat(formData.get("marksObtained") as string);
  const feedback = formData.get("feedback") as string;
  const status = (formData.get("status") as string) || "GRADED";

  if (!submissionId) throw new Error("Missing submission ID");

  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      marksObtained: isNaN(marksObtained) ? null : marksObtained,
      feedback: feedback || null,
      status,
      gradedAt: new Date(),
    },
  });

  revalidatePath("/faculty/assignments");
  return { success: true };
}

// ==================== SESSION LOG ACTIONS ====================
export async function logFacultySession(formData: FormData) {
  const session = await requireFacultyOrAdmin();

  const batchId = formData.get("batchId") as string;
  const sessionDateStr = formData.get("sessionDate") as string;
  const topicCovered = formData.get("topicCovered") as string;
  const summary = formData.get("summary") as string;
  const durationMinutes = parseInt(formData.get("durationMinutes") as string, 10) || 60;

  if (!batchId || !sessionDateStr || !topicCovered) {
    throw new Error("Batch, date, and topic covered are required.");
  }

  await prisma.facultySession.create({
    data: {
      batchId,
      facultyId: session.userId as string,
      sessionDate: new Date(sessionDateStr),
      topicCovered,
      summary: summary || null,
      durationMinutes,
      status: "COMPLETED",
    },
  });

  revalidatePath("/faculty");
  revalidatePath("/faculty/sessions");
  return { success: true };
}

// ==================== STUDY MATERIAL ACTIONS ====================
export async function createStudyMaterial(formData: FormData) {
  const session = await requireFacultyOrAdmin();

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const batchId = formData.get("batchId") as string;
  const fileUrl = formData.get("fileUrl") as string;
  const category = (formData.get("category") as string) || "NOTES";

  if (!title || !batchId || !fileUrl) {
    throw new Error("Title, batch, and resource URL are required.");
  }

  await prisma.facultyMaterial.create({
    data: {
      title,
      description: description || null,
      batchId,
      facultyId: session.userId as string,
      fileUrl,
      category,
    },
  });

  revalidatePath("/faculty");
  revalidatePath("/faculty/materials");
  return { success: true };
}
