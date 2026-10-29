/*
 * `/chapter/:unitId`: a knowledge point's chapter, its lessons in order and
 * how far the student is (#13 point 1, #50 point 1).
 *
 * The chapter stays on the sky, like the stage it leads to ("practice stays
 * on the planet"): the star with its ring filling as lessons pass, one lit
 * button for the lesson to go on with, and the lessons as rows (Components,
 * "Grouped list": every navigation target is a row with a chevron; rows carry
 * their status, never a button). Opened from a star, the jump plays first.
 *
 * A lesson open to the student and not done yet also offers 「跳过这一课」
 * beside its row: the short quiz that tests out of it (`quiz.ts`). A locked
 * lesson offers none (#81).
 *
 * Lit is the star map's word, not the lessons' (#342): every lesson done is
 * not a lit point when some were passed by a quiz, so the card says what the
 * sky says, and only lessons when the sky cannot be read.
 *
 * `?skill=` opens one small star of the point instead (#501): its practice
 * sets in order, stage by stage, the one to do now lit, what it asks to be
 * learned first beside them -- and the sets open all the same (ADR 0004).
 * A small star the point does not have, or one with no practice sets of its
 * own (a ZAP skill), leaves the whole chapter.
 */
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { Murmi } from '@/components/brand/Murmi'
import { Button } from '@/components/base'
import { BUTTON_SIZES, ICON } from '@/components/base/sizes'
import { ConstellationPath } from '@/features/chapter/ConstellationPath'
import { JumpTransition } from '@/features/chapter/JumpTransition'
import { chapterPath, isOpenLesson, nextLessonOf, SKILL_PARAM, useChapter, type Chapter } from '@/features/chapter/useChapter'
import { ExtensionTag, SkillHints } from '@/features/starmap/components/SkillHints'
import { StarGlyph } from '@/features/starmap/components/StarGlyph'
import type { KnowledgeSkill } from '@/features/starmap/model/starMap'
import { isPracticeSetOf, isQuestionType, prerequisiteHints, stageTitle } from '@/features/starmap/model/skillPractice'
import { useKnowledgeMapQuery } from '@/hooks/practice/useKnowledgeMapQuery'
import { pathForTarget } from '@/features/starmap/view/layers'
import { AppLayout } from '@/layouts/AppLayout'

const plainOnSky =
  'inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-[color:var(--on-sky-plain)] no-underline hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function ChapterView({ unitId }: { unitId: string | undefined }) {
  const [params] = useSearchParams()
  const skillId = params.get(SKILL_PARAM)
  // A small star's page waits for the small stars, or it would open as the whole chapter first.
  const query = useChapter(unitId, { waitForSkills: Boolean(skillId) })
  const skill =
    query.status === 'ready' && skillId
      ? query.chapter.skills.find((candidate) => candidate.skillId === skillId && isQuestionType(candidate, query.chapter.unitId))
      : undefined

  return (
    <AppLayout surface="sky">
      <JumpTransition>
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
          {query.status !== 'ready' ? (
            <ChapterState query={query} />
          ) : skill && query.chapter.lessons.some((lesson) => isPracticeSetOf(lesson.id, skill.skillId, query.chapter.practiceSets)) ? (
            <SkillBody chapter={query.chapter} skill={skill} />
          ) : (
            <ChapterBody chapter={query.chapter} />
          )}
        </div>
      </JumpTransition>
    </AppLayout>
  )
}

function ChapterState({ query }: { query: Exclude<ReturnType<typeof useChapter>, { status: 'ready' }> }) {
  const { t } = useTranslation('chapter')
  return (
    <>
      <Link to="/" className={plainOnSky}>
        <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('chapter.backToMap')}
      </Link>
      {query.status === 'loading' ? (
        <div className="flex items-center gap-2">
          <Murmi mood="thinking" size="var(--murmi-inline)" />
          <p role="status" className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">
            {t('chapter.loading')}
          </p>
        </div>
      ) : query.status === 'error' ? (
        <div className="flex flex-col items-start gap-3">
          <Murmi mood="thinking" size="var(--murmi-state)" />
          <p role="alert" className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">
            {t('chapter.failed')}
          </p>
          <Button variant="onSkyPlain" onClick={query.retry}>
            {t('chapter.retry')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <Murmi mood="calm" size="var(--murmi-state)" />
          <p role="alert" className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">
            {t('chapter.missing')}
          </p>
        </div>
      )}
    </>
  )
}

function ChapterBody({ chapter }: { chapter: Chapter }) {
  const { t } = useTranslation('chapter')
  const next = chapter.lessons.find((lesson) => lesson.id === chapter.nextLessonId)
  const allDone = chapter.total > 0 && chapter.done >= chapter.total
  const first = chapter.lessons[0]
  const primary = next
    ? { to: chapterPath(chapter.unitId, next.id), label: t(chapter.done > 0 ? 'chapter.continue' : 'chapter.start', { title: next.title }) }
    : allDone && first
      ? { to: chapterPath(chapter.unitId, first.id), label: t('chapter.again') }
      : null
  const percent = chapter.total > 0 ? Math.round((chapter.done / chapter.total) * 100) : 0
  const lessonsLabel = t('chapter.lessons', { done: chapter.done, total: chapter.total })
  const remaining = Math.max(0, chapter.total - chapter.done)
  const star = chapter.star
  const lit = star?.state === 'lit'
  const standing =
    star?.state === 'locked'
      ? t('chapter.locked')
      : lit
        ? t('chapter.lit')
        : star && star.unmetExercises > 0
          ? t('chapter.unmet', { count: star.unmetExercises })
          : remaining > 0
            ? t('chapter.toGo', { count: remaining })
            : t('chapter.allDone')

  return (
    <>
      <Link
        to={pathForTarget(chapter.subjectId, { layer: 'star', nebulaId: chapter.topicId, unitId: chapter.unitId })}
        className={plainOnSky}
      >
        <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('chapter.backToMap')}
      </Link>

      <header className="flex items-center gap-4">
        <div className="shrink-0">
          <StarGlyph state={lit ? 'lit' : star?.state === 'locked' ? 'locked' : chapter.done > 0 ? 'in_progress' : 'ready'} size={72} progress={chapter.total ? chapter.done / chapter.total : 0} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 text-on-sky" style={{ font: 'var(--t-title1)', letterSpacing: 'var(--t-title1-tracking)' }}>
            {chapter.title}
          </h1>
          <p className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">{lessonsLabel}</p>
        </div>
      </header>

      {/* Where the constellation ends, rather than how full a bar is. "Four
        * stars to go before this point lights" is the thing a student is
        * actually working towards; 33% is not. The bar's semantics stay — a
        * screen reader still hears a progressbar with its value. */}
      <div
        className="flex items-center gap-3 rounded-[var(--r-card)] border p-4"
        style={{ background: 'var(--sky-glass)', borderColor: 'var(--sky-glass-border)' }}
      >
        <Murmi mood={lit || (!star && remaining === 0) ? 'delighted' : 'watching'} size={56} />
        <p
          role="progressbar"
          aria-label={t('chapter.progress')}
          aria-valuetext={lessonsLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="m-0 text-[15px] font-bold text-[color:var(--lit)]"
        >
          {standing}
        </p>
      </div>

      {primary && (
        <div>
          <Button asChild lift variant="onSky" size="large" className="max-w-full py-3" style={{ minWidth: 200, minHeight: BUTTON_SIZES.large.height, height: 'auto' }}>
            <Link to={primary.to}>
              <span className="min-w-0 whitespace-normal leading-5 [overflow-wrap:anywhere]">{primary.label}</span>
            </Link>
          </Button>
        </div>
      )}

      {chapter.lessons.length === 0 ? (
        <p className="m-0 text-[15px] text-[color:var(--on-sky-text-body)]">{t('chapter.empty')}</p>
      ) : (
        <ConstellationPath unitId={chapter.unitId} lessons={chapter.lessons} nextLessonId={chapter.nextLessonId} />
      )}
    </>
  )
}

/**
 * One small star (#501): its practice sets in `order`, each titled by its
 * stage ("Stufe 2") under the small star's name, done ones ticked and the one
 * to do now lit -- the chapter's own constellation, narrowed to them.
 */
function SkillBody({ chapter, skill }: { chapter: Chapter; skill: KnowledgeSkill }) {
  const { t } = useTranslation('chapter')
  const sky = useKnowledgeMapQuery().data
  const sets = chapter.lessons
    .filter((lesson) => isPracticeSetOf(lesson.id, skill.skillId, chapter.practiceSets))
    .map((lesson) => ({ ...lesson, title: stageTitle(lesson.title, skill.name) }))
  const done = sets.filter((lesson) => lesson.status === 'completed').length
  const nextId = nextLessonOf(sets)
  const next = sets.find((lesson) => lesson.id === nextId)
  const remaining = sets.length - done
  const lit = skill.lit || (sets.length > 0 && remaining === 0)
  const setsLabel = t('skill.setsDone', { done, total: sets.length })
  const percent = sets.length > 0 ? Math.round((done / sets.length) * 100) : 0
  const hints = prerequisiteHints(skill, chapter.unitId, sky ?? { stars: [], nebulae: [] })

  return (
    <>
      <Link
        to={pathForTarget(chapter.subjectId, { layer: 'star', nebulaId: chapter.topicId, unitId: chapter.unitId })}
        className={plainOnSky}
      >
        <ChevronLeft size={18} strokeWidth={ICON.stroke} aria-hidden="true" />
        {t('chapter.backToMap')}
      </Link>

      <header className="flex items-center gap-4" data-skill-page={skill.skillId}>
        <div className="shrink-0">
          <StarGlyph state={lit ? 'lit' : done > 0 ? 'in_progress' : 'ready'} size={56} progress={sets.length ? done / sets.length : 0} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="m-0 text-on-sky" style={{ font: 'var(--t-title1)', letterSpacing: 'var(--t-title1-tracking)' }}>
            {skill.name}
          </h1>
          <p className="m-0 inline-flex flex-wrap items-center gap-2 text-[15px] text-[color:var(--on-sky-text-body)]">
            <Link
              to={chapterPath(chapter.unitId)}
              className="text-[color:var(--on-sky-plain)] underline decoration-white/30 underline-offset-2 hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {t('skill.inStar', { star: chapter.title })}
            </Link>
            {skill.extension && <ExtensionTag />}
          </p>
        </div>
      </header>

      <div
        className="flex items-center gap-3 rounded-[var(--r-card)] border p-4"
        style={{ background: 'var(--sky-glass)', borderColor: 'var(--sky-glass-border)' }}
      >
        <Murmi mood={lit ? 'delighted' : 'watching'} size={56} />
        <div className="flex min-w-0 flex-col gap-1">
          <p
            role="progressbar"
            aria-label={t('skill.progress')}
            aria-valuetext={setsLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="m-0 text-[15px] font-bold text-[color:var(--lit)]"
          >
            {lit ? t('skill.lit') : t('skill.toGo', { count: remaining })}
          </p>
          {skill.extension && <p className="m-0 text-[13px] text-[color:var(--on-sky-text-body)]">{t('skill.extensionNote')}</p>}
        </div>
      </div>

      <SkillHints
        hints={hints}
        stillOpen={sets.some((lesson) => isOpenLesson(lesson.status))}
        to={(target) =>
          target.nebulaId && target.subjectId
            ? pathForTarget(target.subjectId, { layer: 'star', nebulaId: target.nebulaId, unitId: target.unitId })
            : null
        }
      />

      {next && (
        <div>
          <Button asChild lift variant="onSky" size="large" className="max-w-full py-3" style={{ minWidth: 200, minHeight: BUTTON_SIZES.large.height, height: 'auto' }}>
            <Link to={chapterPath(chapter.unitId, next.id)}>
              <span className="min-w-0 whitespace-normal leading-5 [overflow-wrap:anywhere]">
                {t(done > 0 ? 'chapter.continue' : 'chapter.start', { title: next.title })}
              </span>
            </Link>
          </Button>
        </div>
      )}

      <ConstellationPath unitId={chapter.unitId} lessons={sets} nextLessonId={nextId} label={t('skill.sets')} />
    </>
  )
}
