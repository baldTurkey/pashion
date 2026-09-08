"use client"

import { FormEvent, useState } from "react";
import { CheckIcon, CheckCircleIcon } from "./Icons";

const PERKS = [
  "Vote on live design submissions",
  "Follow your favorite designers",
  "Support local businesses",
];

export default function Signup() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Hook this up to your real signup endpoint.
    setSubmitted(true);
  }

  return (
    <section className="signup" id="signup">
      <div className="wrap">
        <div>
          <span className="eyebrow">Join Pashion</span>
          <h2>Ready to make your mark?</h2>
          <p className="body-text">
            Whether you&apos;re here to submit a sketch or cast your vote,
            sign up to follow the shows, save your favorites, and get
            notified the moment voting opens.
          </p>
          <ul className="perk-list">
            {PERKS.map((perk) => (
              <li key={perk}>
                <CheckIcon />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="form-card">
          {!submitted ? (
            <div>
              <div className="form-top">
                <h3>Reach Out!</h3>
                <span>01 / 01</span>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="fname">First name</label>
                    <input id="fname" name="fname" type="text" required />
                  </div>
                  <div className="field">
                    <label htmlFor="lname">Last name</label>
                    <input id="lname" name="lname" type="text" required />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field full">
                    <label htmlFor="email">Email address</label>
                    <input id="email" name="email" type="email" required />
                  </div>
                </div>
                <div className="field-row">
                  <div className="field full">
                    <label htmlFor="role">I&apos;m joining as a...</label>
                    <select id="role" name="role" required defaultValue="">
                      <option value="" disabled>Select one</option>
                      <option>Shopper / Voter</option>
                      <option>Designer</option>
                      <option>Brand partner</option>
                    </select>
                  </div>
                </div>
                <div className="field-row">
                  <div className="field full">
                    <label htmlFor="message">Anything we should know? (optional)</label>
                    <textarea id="message" name="message" rows={3}></textarea>
                  </div>
                </div>
                <button type="submit" className="btn btn-solid">Reach Out</button>
                <p className="form-note">
                  By signing up you agree to be our testers, mwah hahahah.
                </p>
              </form>
            </div>
          ) : (
            <div className="form-success show">
              <CheckCircleIcon />
              <h3>You&apos;re on the list</h3>
              <p>Check your inbox to confirm your email and start voting.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
