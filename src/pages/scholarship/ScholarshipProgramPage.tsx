import {
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  HandHeart,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  School,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ContactForm } from '@/components/contact/ContactForm'
import { StoaLogo } from '@/components/common/StoaLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarketingLayout } from '@/layouts/MarketingLayout'
import { stoaContactInfo } from '@/lib/brandContact'

const studyTableImageUrl = new URL('../../../img/library-study-table.jpeg', import.meta.url).href

type ScholarshipCopy = {
  eyebrow: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
  statusLabel: string
  statusText: string
  trustPoints: string[]
  sections: {
    why: {
      kicker: string
      title: string
      body: string
    }
    eligible: {
      kicker: string
      title: string
      body: string
      items: string[]
    }
    support: {
      kicker: string
      title: string
      items: Array<{
        title: string
        body: string
      }>
    }
    pathway: {
      kicker: string
      title: string
      steps: Array<{
        title: string
        body: string
      }>
    }
    schools: {
      kicker: string
      title: string
      body: string
      cta: string
    }
    privacy: {
      kicker: string
      title: string
      body: string
      items: string[]
    }
    application: {
      kicker: string
      title: string
      body: string
      note: string
    }
  }
}

const copies: Record<'en' | 'de', ScholarshipCopy> = {
  en: {
    eyebrow: 'STOA Scholarship Program',
    title: 'Learning support should not depend only on family income.',
    subtitle:
      'The STOA Scholarship Program supports students from financially burdened families with reduced-cost or free learning support, tutoring, exam preparation, learning materials, and carefully guided digital learning tools.',
    primaryCta: 'Request support',
    secondaryCta: 'Contact STOA',
    statusLabel: 'Current structure',
    statusText:
      'This is an internal STOA scholarship program, not an independent foundation. Formal foundation, association, donation, and tax-deductibility topics remain future legal steps.',
    trustPoints: ['Discreet review', 'Clear learning goals', 'Zurich-region contact'],
    sections: {
      why: {
        kicker: 'Why',
        title: 'A quiet way to keep learning support within reach.',
        body:
          'Many students do not need a dramatic intervention. They need structure, calm guidance, qualified teachers, and enough time to rebuild confidence. The scholarship program creates a responsible first path for families who cannot carry the regular cost alone.',
      },
      eligible: {
        kicker: 'Who',
        title: 'For students with real learning need and financial pressure.',
        body:
          'Requests may come from families, teachers, schools, or social services. STOA reviews each situation with care and keeps the first step short, factual, and confidential.',
        items: [
          'Students in primary, secondary, Gymnasium, or transition phases.',
          'Families facing temporary or ongoing financial pressure.',
          'Students who need help in mathematics, science, languages, exam preparation, or learning structure.',
          'School or social-service referrals where a student needs support but the family is unsure where to turn.',
        ],
      },
      support: {
        kicker: 'What',
        title: 'What the program can support',
        items: [
          {
            title: 'Learning assessment',
            body: 'A careful review of the student’s current level, gaps, and goals.',
          },
          {
            title: 'Tutoring support',
            body: 'Reduced-cost or fully supported tutoring in selected school subjects.',
          },
          {
            title: 'Exam preparation',
            body: 'Focused support before entrance exams, school transitions, or important assessments.',
          },
          {
            title: 'Learning materials',
            body: 'Selected exercises, notes, digital resources, and structured practice material.',
          },
          {
            title: 'Guided digital learning',
            body: 'Carefully supervised use of STOA learning tools where pedagogically appropriate.',
          },
          {
            title: 'Teacher help',
            body: 'Professional teacher support when a student needs human explanation beyond guided practice.',
          },
        ],
      },
      pathway: {
        kicker: 'Pathway',
        title: 'How a request is handled',
        steps: [
          {
            title: 'Confidential request',
            body: 'A family, teacher, school, or social service shares a short description of the situation.',
          },
          {
            title: 'Learning conversation',
            body: 'STOA clarifies the student’s goals, school context, and immediate support need.',
          },
          {
            title: 'Scholarship review',
            body: 'The team considers whether partial or full support is appropriate and realistic.',
          },
          {
            title: 'Matched support',
            body: 'If accepted, the student receives a suitable learning plan and access to qualified support.',
          },
        ],
      },
      schools: {
        kicker: 'Schools',
        title: 'Referrals can stay simple and discreet.',
        body:
          'Teachers and social workers often notice learning needs early. A short note explaining the academic need and family situation is enough to begin a conversation.',
        cta: 'Recommend a student',
      },
      privacy: {
        kicker: 'Discretion',
        title: 'Support should never feel like exposure.',
        body:
          'Families should not need to publicly explain their difficulties. STOA asks only for the information needed to understand the situation and make a responsible decision.',
        items: [
          'No public hardship stories.',
          'No unnecessary document upload in the first step.',
          'Scholarship places are separated from commercial discounts.',
          'Every approved place should have a clear reason, support level, and learning goal.',
        ],
      },
      application: {
        kicker: 'Apply',
        title: 'Start with a short confidential message.',
        body:
          'Tell us who the request is for, what kind of support is needed, and whether a school or social service is involved. The team will follow up personally.',
        note: 'For scholarship requests, choose “School partnership” or “Other” as the topic and mention the scholarship program in your message.',
      },
    },
  },
  de: {
    eyebrow: 'STOA Stipendienprogramm',
    title: 'Lernunterstützung soll nicht allein vom Einkommen der Eltern abhängen.',
    subtitle:
      'Das STOA Stipendienprogramm unterstützt Schülerinnen und Schüler aus finanziell belasteten Familien mit vergünstigter oder kostenloser Lernbegleitung, Nachhilfe, Prüfungsvorbereitung, Lernmaterialien und sorgfältig begleiteten digitalen Lernwerkzeugen.',
    primaryCta: 'Unterstützung anfragen',
    secondaryCta: 'STOA kontaktieren',
    statusLabel: 'Aktuelle Struktur',
    statusText:
      'Dies ist ein internes STOA Stipendienprogramm, keine eigenständige Stiftung. Formale Stiftung, Verein, Spenden und steuerliche Abzugsfähigkeit bleiben spätere rechtliche Schritte.',
    trustPoints: ['Diskrete Prüfung', 'Klare Lernziele', 'Kontakt in der Region Zürich'],
    sections: {
      why: {
        kicker: 'Warum',
        title: 'Ein ruhiger Weg, damit Lernunterstützung erreichbar bleibt.',
        body:
          'Viele Schülerinnen und Schüler brauchen keinen dramatischen Eingriff. Sie brauchen Struktur, ruhige Begleitung, qualifizierte Lehrpersonen und genügend Zeit, um Vertrauen aufzubauen. Das Stipendienprogramm schafft einen verantwortungsvollen ersten Weg für Familien, die die regulären Kosten nicht allein tragen können.',
      },
      eligible: {
        kicker: 'Für wen',
        title: 'Für Lernende mit echtem Unterstützungsbedarf und finanzieller Belastung.',
        body:
          'Anfragen können von Familien, Lehrpersonen, Schulen oder Sozialstellen kommen. STOA prüft jede Situation sorgfältig und hält den ersten Schritt kurz, sachlich und vertraulich.',
        items: [
          'Schülerinnen und Schüler in Primarstufe, Sekundarstufe, Gymnasium oder Übergangsphasen.',
          'Familien mit vorübergehender oder dauerhafter finanzieller Belastung.',
          'Lernende mit Bedarf in Mathematik, Naturwissenschaften, Sprachen, Prüfungsvorbereitung oder Lernstruktur.',
          'Empfehlungen von Schulen oder Sozialstellen, wenn ein Kind Unterstützung braucht und die Familie nicht weiss, wohin sie sich wenden soll.',
        ],
      },
      support: {
        kicker: 'Was',
        title: 'Was das Programm ermöglichen kann',
        items: [
          {
            title: 'Standortbestimmung',
            body: 'Eine sorgfältige Einschätzung des Lernstands, der Lücken und der Ziele.',
          },
          {
            title: 'Nachhilfe',
            body: 'Vergünstigte oder vollständig unterstützte Nachhilfe in ausgewählten Schulfächern.',
          },
          {
            title: 'Prüfungsvorbereitung',
            body: 'Gezielte Unterstützung vor Aufnahmeprüfungen, Schulwechseln oder wichtigen Leistungsphasen.',
          },
          {
            title: 'Lernmaterialien',
            body: 'Ausgewählte Übungen, Notizen, digitale Ressourcen und strukturierte Übungsmaterialien.',
          },
          {
            title: 'Begleitete digitale Lernunterstützung',
            body: 'Sorgfältig begleitete Nutzung von STOA Lernwerkzeugen, wo pädagogisch sinnvoll.',
          },
          {
            title: 'Lehrpersonen-Unterstützung',
            body: 'Professionelle Unterstützung durch Lehrpersonen, wenn ein Schüler menschliche Erklärung über geführtes Üben hinaus braucht.',
          },
        ],
      },
      pathway: {
        kicker: 'Ablauf',
        title: 'Wie eine Anfrage bearbeitet wird',
        steps: [
          {
            title: 'Vertrauliche Anfrage',
            body: 'Eine Familie, Lehrperson, Schule oder Sozialstelle beschreibt die Situation kurz.',
          },
          {
            title: 'Lerngespräch',
            body: 'STOA klärt Ziele, schulische Ausgangslage und den unmittelbaren Unterstützungsbedarf.',
          },
          {
            title: 'Stipendienprüfung',
            body: 'Das Team prüft, ob teilweise oder vollständige Unterstützung passend und realistisch ist.',
          },
          {
            title: 'Passende Lernbegleitung',
            body: 'Bei Annahme erhält die Schülerin oder der Schüler einen geeigneten Lernplan und Zugang zu qualifizierter Unterstützung.',
          },
        ],
      },
      schools: {
        kicker: 'Schulen',
        title: 'Empfehlungen können einfach und diskret bleiben.',
        body:
          'Lehrpersonen und Sozialarbeitende erkennen Lernbedarf oft früh. Eine kurze Einschätzung des schulischen Bedarfs und der familiären Situation genügt, um ein Gespräch zu beginnen.',
        cta: 'Schüler/in empfehlen',
      },
      privacy: {
        kicker: 'Diskretion',
        title: 'Unterstützung soll niemals blossstellen.',
        body:
          'Familien sollen ihre Schwierigkeiten nicht öffentlich erklären müssen. STOA fragt nur nach Informationen, die notwendig sind, um die Situation zu verstehen und verantwortungsvoll zu entscheiden.',
        items: [
          'Keine öffentlichen Härtefallgeschichten.',
          'Keine unnötigen Dokumentenuploads im ersten Schritt.',
          'Stipendienplätze werden von kommerziellen Rabatten getrennt.',
          'Jeder bewilligte Platz sollte Grund, Unterstützungsumfang und Lernziel klar festhalten.',
        ],
      },
      application: {
        kicker: 'Anfrage',
        title: 'Beginnen Sie mit einer kurzen vertraulichen Nachricht.',
        body:
          'Schreiben Sie, für wen die Anfrage ist, welche Unterstützung gebraucht wird und ob eine Schule oder Sozialstelle beteiligt ist. Das Team meldet sich persönlich.',
        note: 'Für Stipendienanfragen wählen Sie im Formular „Schulpartnerschaft“ oder „Sonstiges“ und erwähnen das Stipendienprogramm in der Nachricht.',
      },
    },
  },
}

const supportIcons = [BookOpen, GraduationCap, FileText, CheckCircle2, School, HandHeart] as const

function getScholarshipCopy(language: string): ScholarshipCopy {
  return language.startsWith('de') ? copies.de : copies.en
}

export function ScholarshipProgramPage() {
  const { i18n } = useTranslation()
  const copy = getScholarshipCopy(i18n.language)

  return (
    <MarketingLayout>
      <div className="bg-[hsl(42_34%_94%)] text-foreground">
        <section className="border-b border-[hsl(var(--border)/0.75)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-[hsl(var(--border)/0.9)] bg-white/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--stoa-brand-gold))]" />
                {copy.eyebrow}
              </div>
              <div className="space-y-5">
                <h1 className="editorial-heading max-w-4xl text-4xl leading-[1.04] text-[hsl(var(--stoa-brand-charcoal))] md:text-6xl">
                  {copy.title}
                </h1>
                <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  {copy.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="premium-primary-button h-auto min-h-11 whitespace-normal px-6 py-3 text-center">
                  <a href="#application">{copy.primaryCta}</a>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-auto min-h-11 whitespace-normal px-6 py-3 text-center">
                  <Link to="/contact">{copy.secondaryCta}</Link>
                </Button>
              </div>
              <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                {copy.trustPoints.map((point) => (
                  <div key={point} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-[hsl(var(--border)/0.8)] bg-white shadow-sm">
                <img
                  src={studyTableImageUrl}
                  alt=""
                  className="h-72 w-full object-cover md:h-96"
                  aria-hidden="true"
                />
              </div>
              <div className="rounded-lg border border-[hsl(var(--border)/0.8)] bg-white/78 p-5 shadow-sm">
                <StoaLogo size="md" />
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-semibold text-foreground">{copy.statusLabel}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{copy.statusText}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.72fr_1.28fr] lg:py-16">
          <div>
            <p className="brand-section-kicker">{copy.sections.why.kicker}</p>
          </div>
          <div className="max-w-3xl space-y-4">
            <h2 className="editorial-heading text-3xl leading-tight md:text-5xl">
              {copy.sections.why.title}
            </h2>
            <p className="text-base leading-8 text-muted-foreground">
              {copy.sections.why.body}
            </p>
          </div>
        </section>

        <section className="border-y border-[hsl(var(--border)/0.75)] bg-white/48">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-16">
            <div className="space-y-4">
              <p className="brand-section-kicker">{copy.sections.eligible.kicker}</p>
              <h2 className="editorial-heading text-3xl leading-tight md:text-4xl">
                {copy.sections.eligible.title}
              </h2>
              <p className="text-sm leading-7 text-muted-foreground">
                {copy.sections.eligible.body}
              </p>
            </div>
            <div className="grid gap-3">
              {copy.sections.eligible.items.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-[hsl(var(--border)/0.8)] bg-[hsl(42_34%_96%)] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:py-16">
          <div className="mb-8 max-w-3xl space-y-3">
            <p className="brand-section-kicker">{copy.sections.support.kicker}</p>
            <h2 className="editorial-heading text-3xl leading-tight md:text-4xl">
              {copy.sections.support.title}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {copy.sections.support.items.map((item, index) => {
              const Icon = supportIcons[index]
              return (
                <Card key={item.title} className="bg-white/72">
                  <CardHeader className="space-y-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy))]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="border-y border-[hsl(var(--border)/0.75)] bg-[hsl(var(--stoa-brand-charcoal))] text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:py-16">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--stoa-brand-gold))]">
                {copy.sections.pathway.kicker}
              </p>
              <h2 className="editorial-heading text-3xl leading-tight md:text-4xl">
                {copy.sections.pathway.title}
              </h2>
            </div>
            <div className="grid gap-4">
              {copy.sections.pathway.steps.map((step, index) => (
                <div key={step.title} className="grid gap-4 rounded-lg border border-white/15 bg-white/[0.06] p-5 sm:grid-cols-[3rem_1fr]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[hsl(var(--stoa-brand-gold)/0.5)] text-sm font-semibold text-[hsl(var(--stoa-brand-gold))]">
                    {index + 1}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm leading-6 text-white/72">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
          <Card className="bg-white/72">
            <CardHeader className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy))]">
                <School className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="brand-section-kicker">{copy.sections.schools.kicker}</p>
              <CardTitle className="editorial-heading text-3xl">{copy.sections.schools.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-muted-foreground">{copy.sections.schools.body}</p>
              <Button asChild variant="outline" className="h-auto min-h-10 whitespace-normal px-4 py-2 text-center">
                <a href="#application">{copy.sections.schools.cta}</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/72">
            <CardHeader className="space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy))]">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="brand-section-kicker">{copy.sections.privacy.kicker}</p>
              <CardTitle className="editorial-heading text-3xl">{copy.sections.privacy.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-muted-foreground">{copy.sections.privacy.body}</p>
              <ul className="grid gap-2 text-sm text-muted-foreground">
                {copy.sections.privacy.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section id="application" className="border-t border-[hsl(var(--border)/0.75)] bg-white/52">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.82fr_1.18fr] lg:py-16">
            <div className="space-y-6">
              <div className="space-y-4">
                <p className="brand-section-kicker">{copy.sections.application.kicker}</p>
                <h2 className="editorial-heading text-3xl leading-tight md:text-4xl">
                  {copy.sections.application.title}
                </h2>
                <p className="text-sm leading-7 text-muted-foreground">
                  {copy.sections.application.body}
                </p>
                <p className="rounded-lg border border-[hsl(var(--border)/0.85)] bg-[hsl(42_34%_96%)] p-4 text-sm leading-6 text-muted-foreground">
                  {copy.sections.application.note}
                </p>
              </div>
              <address className="space-y-3 not-italic text-sm text-muted-foreground">
                <a className="flex items-center gap-3 hover:text-foreground" href={`mailto:${stoaContactInfo.email}`}>
                  <Mail className="h-4 w-4 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                  {stoaContactInfo.email}
                </a>
                <a className="flex items-center gap-3 hover:text-foreground" href={stoaContactInfo.phoneHref}>
                  <Phone className="h-4 w-4 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                  {stoaContactInfo.phone}
                </a>
                <p className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-[hsl(var(--stoa-brand-burgundy))]" aria-hidden="true" />
                  {stoaContactInfo.locations}
                </p>
              </address>
            </div>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl">{copy.primaryCta}</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </MarketingLayout>
  )
}
