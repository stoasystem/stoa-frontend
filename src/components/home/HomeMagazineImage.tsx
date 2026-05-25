import { MessageCircle, Sparkles } from 'lucide-react'

export function HomeMagazineImage() {
  return (
    <div className="premium-reveal-delay relative min-h-[32rem] overflow-hidden rounded-[1.5rem] border border-border/70 bg-[#192433] shadow-[0_30px_90px_hsl(217_45%_15%_/_0.18)]">
      <img
        src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80"
        alt="Quiet study table with open books in a library"
        className="absolute inset-0 h-full w-full object-cover opacity-72"
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(217_45%_15%_/_0.88),hsl(217_45%_15%_/_0.2)_50%,hsl(40_39%_49%_/_0.45))]" />
      <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/86 backdrop-blur">
        Study room
      </div>
      <div className="absolute bottom-5 left-5 right-5 grid gap-4 md:grid-cols-[1fr_0.78fr] md:items-end">
        <div className="rounded-xl border border-white/18 bg-white/88 p-4 text-[#152238] shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7e8f7c]">
            <Sparkles className="h-4 w-4" />
            Live explanation
          </div>
          <p className="mt-3 text-lg font-semibold leading-6">
            Start with your question. STOA AI explains the next step before a teacher joins.
          </p>
          <div className="mt-4 rounded-lg bg-[#f7f3ec] p-3 text-sm leading-6 text-[#445066]">
            Try: "Why does subtracting 2 from both sides keep the equation balanced?"
          </div>
        </div>
        <div className="rounded-xl border border-white/16 bg-[#152238]/88 p-4 text-white shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="h-4 w-4 text-[#c2a15a]" />
            Tutor escalation
          </div>
          <p className="mt-2 text-sm leading-6 text-white/75">
            If the AI answer is still unclear, ask a human tutor from the same conversation.
          </p>
        </div>
      </div>
    </div>
  )
}
