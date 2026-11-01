export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { UserPlus, Shield, KeyRound, ArrowLeft } from "lucide-react";
import styles from "./page.module.css";
import { createEmployee, deleteEmployee, resetUserPassword } from "./actions";
import { DeleteButton } from "../DeleteButton";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function UserManagementPage() {
  redirect("/users");
}
