import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Calculator,
  Check,
  LockKeyhole,
  Puzzle,
  ShieldCheck,
  SpellCheck,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIdentity } from "@/components/BrandIdentity";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { GAMES, GAME_ORDER } from "@/lib/games";
import welcomeImage from "@/assets/dut-students-welcome.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LearnAware — DUT Disability Unit" },
      {
        name: "description",
        content:
          "A calm, game-based early-warning screening for DUT students. Six short activities highlight possible learning-support needs for human review.",
      },
      { property: "og:title", content: "LearnAware — DUT Disability Unit" },
      {
        property: "og:description",
        content: "Six short activities and one supportive summary. Screening indicators only — never a diagnosis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ICONS = { Calculator, SpellCheck, Brain, BookOpen, Puzzle, Target } as const;

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link to="/" aria-label="LearnAware home">
            <BrandIdentity />
          </Link>
          <Button asChild size="lg">
            <Link to="/auth">Sign in <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
        </div>
      </header>

      <main id="main-content">
        <section className="relative min-h-[620px] overflow-hidden bg-sidebar md:min-h-[680px]">
          <img
            src={welcomeImage}
            alt="DUT students walking together on campus"
            width={1600}
            height={1008}
            className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
          />
          <div className="absolute inset-0 bg-hero-overlay" aria-hidden="true" />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl items-center px-4 py-16 md:min-h-[680px] md:px-8">
            <div className="max-w-2xl text-hero-foreground">
              <p className="mb-5 inline-flex items-center gap-2 border-l-2 border-brand-spark pl-3 text-sm font-bold">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Private. Supportive. Reviewed by people.
              </p>
              <h1 className="text-balance-tight font-display text-5xl font-bold leading-[1.05] md:text-7xl">
                Notice what helps you learn.
              </h1>
              <p className="mt-6 max-w-xl text-base text-hero-muted md:text-lg">
                Six short activities can help you and the DUT Disability Unit spot where a little extra support may make studying easier.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary" className="h-12 px-6">
                  <Link to="/auth">Start when you’re ready <ArrowRight className="size-4" aria-hidden="true" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-brand-on-dark-muted bg-hero-overlay text-hero-foreground hover:bg-card hover:text-foreground">
                  <Link to="/auth">Staff and admin</Link>
                </Button>
              </div>
              <p className="mt-5 text-xs font-semibold text-hero-muted">About 20 minutes · Pause between activities · No pass or fail</p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 md:grid-cols-3 md:px-8">
            {[
              [LockKeyhole, "You stay in control", "Nothing is recorded before you read and accept the consent notice."],
              [Users, "A person reviews", "Medium and high indicators are considered by Disability Unit staff, never an algorithm alone."],
              [Check, "Clear next steps", "Your summary uses everyday language and focuses on practical ways forward."],
            ].map(([Icon, title, body]) => {
              const ItemIcon = Icon as typeof LockKeyhole;
              return (
                <article key={title as string} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-accent-foreground">
                    <ItemIcon className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-display text-base font-bold">{title as string}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{body as string}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.5fr]">
            <div>
              <p className="text-sm font-bold text-primary">THE ACTIVITIES</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-4xl">Small challenges. Useful signals.</h2>
              <p className="mt-4 text-muted-foreground">
                Pick any activity and level in the order that suits you. Each one looks at a different part of learning.
              </p>
              <NotDiagnosisNote className="mt-6" variant="subtle" />
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {GAME_ORDER.map((type, index) => {
                const game = GAMES[type];
                const Icon = ICONS[game.icon as keyof typeof ICONS];
                return (
                  <article key={type} className="bg-card p-5 transition-colors hover:bg-muted/60">
                    <div className="flex items-start gap-4">
                      <span className="font-display text-xs font-bold text-muted-foreground">0{index + 1}</span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-display font-bold">{game.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{game.why}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-primary-soft">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-4 py-12 md:flex-row md:items-center md:px-8">
            <div>
              <h2 className="font-display text-3xl font-bold">Ready when you are.</h2>
              <p className="mt-2 text-muted-foreground">Create your student account, read the consent notice, then begin at your own pace.</p>
            </div>
            <Button asChild size="lg" className="h-12 shrink-0 px-6">
              <Link to="/auth">Create a student account <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 md:flex-row md:items-end md:justify-between md:px-8">
          <BrandIdentity inverted />
          <p className="max-w-2xl text-xs text-sidebar-foreground/75">
            Academic project by Group 21. This system screens for possible learning-support indicators. It does not diagnose, treat, or replace a psychologist, specialist, or formal assessment.
          </p>
        </div>
      </footer>
    </div>
  );
}
