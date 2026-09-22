import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";

type TeamMember = {
  name: string;
  role?: string;
  email: string;
  linkedin?: string;
};

const teamMembers: TeamMember[] = [
  {
    name: "Shorya Miglani",
    role: "Project Lead",
    email: "miglanishorya@gmail.com",
    linkedin: "https://www.linkedin.com/in/shorya-miglani-64640822b/",
  },
  {
    name: "Patrick Nsubuga",
    email: "pknsubuga07@gmail.com",
    linkedin: "https://www.linkedin.com/in/patrick-n-18a2272a5/",
  },
  {
    name: "Hannah Thomas",
    email: "hzythomas@gmail.com",
    linkedin: "https://www.linkedin.com/in/hzythomas/",
  },
  {
    name: "Arinder Gudavalli",
    email: "argudavalli@gmail.com",
  },
];

export default function OurTeamPage() {
  return (
    <main className="team-page">
      <section className="team-directory">
        <div className="wrap">
          <div className="team-directory-heading">
            <span className="eyebrow">Our team</span>
            <p>The people behind Pashion.</p>
          </div>

          <div className="team-grid">
            {teamMembers.map((member, index) => (
              <article key={member.name} className="team-member">
                <span className="team-member-number">0{index + 1}</span>
                <div className="team-member-main">
                  <p className="team-member-role">{member.role ?? "Pashion Team"}</p>
                  <h2>{member.name}</h2>
                </div>
                <div className="team-member-contacts">
                  <a href={`mailto:${member.email}`} className="team-contact">
                    <Mail aria-hidden="true" />
                    <span>{member.email}</span>
                  </a>
                  {member.linkedin ? (
                    <a href={member.linkedin} target="_blank" rel="noreferrer" className="team-contact">
                      <span className="team-linkedin-mark" aria-hidden="true">in</span>
                      <span>LinkedIn</span>
                      <ArrowUpRight className="team-external-icon" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="team-home-link">
            <Link href="/" className="btn btn-outline">Back to home</Link>
          </div>
        </div>
      </section>
    </main>
  );
}