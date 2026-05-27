import { motion } from "framer-motion";

const items = [
  {
    quote:
      "Joining SkillyMe is one of the best decisions I've made recently and I couldn't be more grateful for the outcome. From the mentorship, to teamwork, to tasks and contributions it was all an amazing experience. I learned it's not about being the best, but showing up with your best. What made SkillyMe different for me is that I learned not by watching YouTube videos but by building something that had to actually work. And it did. The mentorship was hands-on when it mattered most. When we hit blockers, we got unstuck. When we delivered, we got recognized. That meant something to me not just as a win, but as proof that you actually can do what you say you can, especially with the right people supporting you through it. I would absolutely recommend SkillyMe to anyone, any day, any time. If you're someone who wants to stop learning and start building SkillyMe is where you need to be.",
    name: "Breattah Okeyo",
    role: "Computer Science",
    photo: "/TESTIMONIALS/Breattah_Okeyo_Computer Science.jpeg",
  },
  {
    quote:
      "Being part of the SkillyMe program has been an amazing experience for me. It gave me a chance to grow my skills, work with a great team, and build real projects like PharmX. The collaboration, guidance, and hands-on practice really helped me improve my confidence as a developer. I'm grateful for the opportunity and proud to be part of the Tier 1 contributors.",
    name: "Maxmillin Muiruri Njuguna",
    role: "Tier 1 Contributor",
    photo: "/TESTIMONIALS/Maxmillian Muiruri Njuguna.jpeg",
  },
  {
    quote:
      "Participating in the Skillyme Africa Computer Science Cohort equipped me with practical skills in software development, allowing me to contribute to the creation of a genuine pharmacy application. The program pushed me to think critically, work collaboratively, and apply computer science principles beyond theoretical knowledge. I wholeheartedly recommend Skillyme Africa to anyone seeking to advance in the tech industry.",
    name: "Chris Leo",
    role: "Software Developer",
    photo: "/TESTIMONIALS/Chris_Leo.jpeg",
  },
  {
    quote:
      "I was always coding without direction, but Skillyme Africa gave me an identity. As a Public Health student, being recognized as a top contributor was a defining milestone. The program allowed me to balance my studies while building proficiency in full-stack development—leveraging AI and API architectures for social impact. I am deeply grateful to the team for trusting me and providing this opportunity to bridge the gap between passion and professional expertise.",
    name: "Solomon Omondi Otieno",
    role: "Public Health Student & Full-Stack Developer",
    photo: "/TESTIMONIALS/Solomon_Omondi.jpeg",
  },
  {
    quote:
      "Well, It has been an honor to facilitate the Skillme Cohort for lawyers especially about AI. I believe that ethical AI usage starts with AI literacy and that's exactly Skillme Cohort delivered. Having to share and contribute to such an initiative is a privilege",
    name: "Higenyi Simon",
    role: "Founder Ailex Africa",
    photo: null,
  },
  {
    quote:
      "I think Skillyme is an innovative platform for knowledge and skills transfer in the IT space. I am proud to have worked with such a motivated and professional team and look forward to more engagement in the future.",
    name: "John Kamau",
    role: "Expert Machine Learning Engineer",
    photo: "/TESTIMONIALS/John_Kamau_Expert_Machine _Learning_Engineer.jpeg",
  },
  {
    quote:
      "Skillyme Cohort 1 is the most practical program I've been part of. From day one we were building a real full-stack system not toy projects and by Saturday we had something to actually demo and be proud of. The weekly structure keeps you accountable, the team dynamic pushes you harder than you'd push yourself alone, and the mentorship is genuinely invested in your growth. If you want to level up fast and learn by actually doing, this is the program. I came in as a developer. I'm leaving as an engineer.",
    name: "Victor Chogo",
    role: "Engineer",
    photo: "/TESTIMONIALS/Victor_Chogo.jpeg",
  },
  {
    quote:
      "Even though I am an IT student i was just freestyling code with no structure or direction. That when i stumbled upon SkillyMe program gained hands-on experience building real-world solutions with an amazing team. Together, we developed a system that pushed me to think critically and collaborate effectively. Now i can boldly say that SkillyMe has transformed me from someone who simply writes code into someone who builds systems with purpose, clarity, and confidence, with much stronger understanding of how real development works.",
    name: "Yvonne Wangeci",
    role: "IT Student",
    photo: "/TESTIMONIALS/Yvonne_Wangeci.jpeg",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cyan-accent)]">
            Success stories
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl text-balance">
            Real founders. Real outcomes.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {items.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 2) * 0.08 }}
              className="group relative rounded-3xl border border-black/5 bg-white p-8 transition-all hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.18)] sm:p-10"
            >
              <div className="font-display text-5xl leading-none text-[var(--cyan-accent)]">"</div>
              <blockquote className="mt-3 font-display text-xl leading-relaxed text-[var(--ink)] text-balance sm:text-lg">
                {t.quote}
              </blockquote>
              <figcaption className="mt-8 flex items-center gap-4 border-t border-black/5 pt-6">
                {t.photo ? (
                  <img src={t.photo} alt={t.name} className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ink)] to-[var(--ink-soft)] text-sm font-semibold text-white">
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold text-[var(--ink)]">{t.name}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
