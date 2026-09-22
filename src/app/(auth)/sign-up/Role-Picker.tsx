"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./sign-up.module.css";

const ROLE_OPTIONS = [
  {
    href: "/sign-up/brand",
    label: "Brand",
    description: "Manage your brand's presence and engage with the community",
    icon: "✦",
  },
  {
    href: "/sign-up/designer",
    label: "Designer",
    description: "Create and manage your design projects",
    icon: "◌",
  },
  {
    href: "/sign-up/member",
    label: "Member",
    description: "Look at and purchase all the cool new stuff",
    icon: "♡",
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
          return (
            <button
              key={role.href}
              type="button"
              className={styles.roleCard}
              onClick={() => router.push(role.href)}
            >
              <div className={styles.roleIcon}>
                <span className={styles.roleFlower} aria-hidden="true">
                  {role.icon}
                </span>
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
