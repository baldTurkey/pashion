"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Heart, Truck } from "lucide-react";
import styles from "./sign-up.module.css";

const ROLE_OPTIONS = [
  {
    href: "/sign-up/brand",
    label: "Brand",
    description: "Manage your brand's presence and engage with the community",
    icon: Building2,
  },
  {
    href: "/sign-up/designer",
    label: "Designer",
    description: "Create and manage your design projects",
    icon: Building2,
  },
  {
    href: "/sign-up/member",
    label: "Member",
    description: "Look at and purchase all the cool new stuff",
    icon: Truck,
  },
];

export default function RolePickerPage() {
  const router = useRouter();

  return (
    <div className={styles.card}>
      <h1>Create your account</h1>
      <p className={styles.sub}>Who are you?</p>

      <div className={styles.roleGrid}>
        {ROLE_OPTIONS.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.href}
              type="button"
              className={styles.roleCard}
              onClick={() => router.push(role.href)}
            >
              <div className={styles.roleIcon}>
                <Icon size={22} />
              </div>
              <div>
                <span className={styles.roleLabel}>{role.label}</span>
                <span className={styles.roleDesc}>{role.description}</span>
              </div>
            </button>
          );
        })}
      </div>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link href="/login">Sign In</Link>
      </p>
    </div>
  );
}
