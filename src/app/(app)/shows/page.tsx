"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./page.module.css";
import tuffGuy from "@/components/ui/guy.png";
import patola from "@/components/ui/patola.png";
import travy from "@/components/ui/travy.png";

const LOOKS = [
  { id: "tuff-guy", src: tuffGuy, alt: "Tuff Guy fashion show look", centerScale: 1 },
  { id: "patola", src: patola, alt: "Patola fashion show look", centerScale: 1.65 },
  { id: "travy", src: travy, alt: "Travy fashion show look", centerScale: 1.65 },
];

export default function ShowsPage() {
  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const activeLook = LOOKS[activeLookIndex];
  const leftLook = LOOKS[(activeLookIndex + LOOKS.length - 1) % LOOKS.length];
  const rightLook = LOOKS[(activeLookIndex + 1) % LOOKS.length];

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="shows-title">
        <p className={styles.eyebrow}>Pashion presents</p>
        <h1 id="shows-title" className={styles.title}>
          Coming<br />
          Soon
        </h1>

        <div className={styles.carousel} aria-label="Fashion show look carousel">
          <button
            type="button"
            className={styles.sideLook}
            onClick={() => setActiveLookIndex((activeLookIndex + LOOKS.length - 1) % LOOKS.length)}
            aria-label={`Show ${leftLook.alt}`}
          >
            <span className={styles.sideLookFrame}>
              <Image src={leftLook.src} alt="" className={styles.sideLookImage} />
            </span>
          </button>

          <div className={styles.figure} aria-live="polite">
            <span
              className={styles.figureFrame}
              style={{ scale: activeLook.centerScale }}
            >
              <Image
                src={activeLook.src}
                alt={activeLook.alt}
                className={styles.figureImage}
                priority
              />
            </span>
          </div>

          <button
            type="button"
            className={styles.sideLook}
            onClick={() => setActiveLookIndex((activeLookIndex + 1) % LOOKS.length)}
            aria-label={`Show ${rightLook.alt}`}
          >
            <span className={styles.sideLookFrame}>
              <Image src={rightLook.src} alt="" className={styles.sideLookImage} />
            </span>
          </button>
        </div>

        <div className={styles.countdown} aria-label="Fashion shows launch date to be announced">
          <div className={styles.countdownItem}>
            <strong>17</strong>
            <span>Hours</span>
          </div>
          <div className={styles.countdownItem}>
            <strong>05</strong>
            <span>Days</span>
          </div>
          <div className={styles.countdownItem}>
            <strong>05</strong>
            <span>Weeks</span>
          </div>
        </div>

        <p className={styles.datePlaceholder}>[SHOW DATE TO BE ANNOUNCED]</p>
      </section>

      <section className={styles.introduction} aria-labelledby="about-shows">
        <div className={styles.sectionLabel}>01 / The concept</div>
        <div className={styles.introCopy}>
          <h2 id="about-shows">Check out designs from pashionate people, then bring them too life</h2>
          <p>
            [Have you ever played dress to impress? Pashion is the pashion built by the community. We bring together designers and fashion lovers to create, vote, and bring the best designs to life. Our fashion shows are the culmination of this process, where the community's favorite designs are showcased on the runway.]
          </p>
        </div>
      </section>

      <section className={styles.details} aria-label="Fashion show details">
        <article className={styles.detailBlock}>
          <p className={styles.detailNumber}>02</p>
          <h2>Submit the look</h2>
          <p>[Designers submit their original concepts into exclusive fashio nshows hosted by top brands]</p>
        </article>
        <article className={styles.detailBlock}>
          <p className={styles.detailNumber}>03</p>
          <h2>The public votes</h2>
          <p>[The community decides on their favorite looks and the top voted designs are green lit for production]</p>
        </article>
        <article className={styles.detailBlock}>
          <p className={styles.detailNumber}>04</p>
          <h2>The look ships</h2>
          <p>[Winning designs are manuafctured and transofrmed into real, high quality products]</p>
        </article>
      </section>
    </div>
  );
}