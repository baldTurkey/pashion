"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import flower from "../../../components/ui/flower.png";
import starheart from "../../../components/ui/starheart.png";
import account from "../../../components/ui/account.png";
import styles from "./sign-up.module.css";

const ROLE_OPTIONS = [
  {
    href: "/sign-up/brand",
    label: "Brand",
    description: "Manage your brand's presence and engage with the community",
    image: flower,
  },
  {
    href: "/sign-up/designer",
    label: "Designer",
    description: "Create and manage your design projects",
    image: flower,
  },
  {
    href: "/sign-up/member",
    label: "Member",
    description: "Look at and purchase all the cool new stuff",
    image: flower,
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
                <Image className={styles.roleFlower} src={role.image} alt="" width={56} height={56} />
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
