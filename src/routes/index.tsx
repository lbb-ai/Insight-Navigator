import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Brain,
  Calculator,
  ArrowRight,
  GraduationCap,
  Lock,
  Puzzle,
  ShieldCheck,
  SpellCheck,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotDiagnosisNote } from "@/components/NotDiagnosisNote";
import { GAMES, GAME_ORDER } from "@/lib/games";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Learning Disability Screening — DUT Disability Unit" },
      {
        name: "description",
        content:
          "A calm, game-based early-warning screening for DUT students. Six short activities highlight possible learning-support needs for staff to review. Screening, never diagnosis.",
      },
      { property: "og:title", content: "Learning Disability Screening — DUT Disability Unit" },
      {
        property: "og:description",
        content:
          "Six short activities, one supportive summary, and a human review by the DUT Disability Unit. Screening indicators only — never a diagnosis.",
      },
    ],
  }),
  component: Landing,
});

const ICONS = { Calculator, SpellCheck, Brain, BookOpen, Puzzle, Target } as const;

function Landing() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden="true" />
            </span>
            <span className="font-display text-sm leading-tight font-semibold">
              LD Screening
              <span className="block text-xs font-normal text-muted-foreground">
                DUT Disability Unit
              </span>
            </span>
          </div>
          <Button asChild size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </header>

      <main id="main-content">
        <section className="gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Screening, not diagnosis
            </p>
            <h1 className="max-w-3xl text-balance-tight font-display text-4xl font-bold md:text-6xl">
              Early support starts with noticing, not labelling.
            </h1>
            <p className="mt-5 max-w-2xl text-base opacity-90 md:text-lg">
              The Learning Disability Detector &amp; Classifier System helps Durban University of
              Technology students discover, in about twenty minutes, whether it's worth talking to
              the Disability Unit. Six short activities. One supportive summary. A real person
              reviews every flagged result.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth">
                  Start your screening <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
              >
                <Link to="/auth">Staff &amp; admin sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
          <NotDiagnosisNote />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Six short activities",
                body: "Number, word, memory, reading, logic and attention challenges — designed to feel like well-made games, not a test.",
              },
              {
                icon: Users,
                title: "A human always reviews",
                body: "Medium and high indicators go to Disability Unit staff with the exact signals behind them. No hidden scoring, no automatic decisions.",
              },
              {
                icon: Lock,
                title: "Consent-first and POPIA-aligned",
                body: "Nothing is captured until you give informed consent. Access to your results is limited, logged and reviewable.",
              },
            ].map((item) => (
              <article key={item.title} className="surface-card p-6">
                <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
            <h2 className="font-display text-2xl font-semibold md:text-3xl">
              What you'll actually do
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Each activity takes two to four minutes and gives calm, encouraging feedback. There is
              no score to beat and no comparison to other students.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {GAME_ORDER.map((type) => {
                const game = GAMES[type];
                const Icon = ICONS[game.icon as keyof typeof ICONS];
                return (
                  <article key={type} className="surface-card p-5">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-lg bg-accent-soft text-accent-foreground">
                        <Icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-base font-semibold">{game.title}</h3>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{game.why}</p>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">
                      ≈ {game.minutes} min
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-14 text-center md:px-8">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">
            Ready when you are — it takes about twenty minutes
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            You can pause between activities and pick up where you left off. If anything feels
            unclear, you can request support at any point.
          </p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/auth">Create an account</Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 text-xs text-muted-foreground md:px-8">
          <p className="font-semibold text-foreground">
            Durban University of Technology — Disability Unit
          </p>
          <p className="mt-2 max-w-3xl">
            Academic prototype (Group 21). This system does not diagnose, treat or replace
            psychologists, specialists or formal assessment. Personal information is processed in
            line with South Africa's Protection of Personal Information Act (POPIA).
          </p>
        </div>
      </footer>
    </div>
  );
}
