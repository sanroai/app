'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  useConceptDetail,
  useRateFlashcard,
  type ConceptDetail,
} from '@/lib/learning-hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner, ErrorBanner } from '@/components/ui';
import { ChevronLeft, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  flashcardAnswer,
  recalledPercent,
  MAX_FLASH_CARDS,
  type FlashcardRating,
} from '@/lib/flashcards';

type Rating = FlashcardRating;

type Flashcard = ConceptDetail['practiceQuestions'][number];

const MAX_CARDS = MAX_FLASH_CARDS;

const RATINGS: { label: string; rating: Rating; className: string }[] = [
  { label: 'Again', rating: 'AGAIN', className: 'bg-red-50 text-red-700 hover:bg-red-100' },
  { label: 'Hard', rating: 'HARD', className: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { label: 'Good', rating: 'GOOD', className: 'bg-green-50 text-green-700 hover:bg-green-100' },
  { label: 'Easy', rating: 'EASY', className: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
];

/**
 * The answer side of a card. The graded answer is the option TEXT (that is
 * what Question.answer holds), so for a multiple choice the correct option is
 * revealed - exactly like the mobile flashcard screen.
 */
function answerFor(card: Flashcard): string {
  return flashcardAnswer(card);
}

export default function FlashcardsPage() {
  const params = useParams();
  const conceptId = params.conceptId as string;
  const { data: concept, isLoading, error } = useConceptDetail(conceptId);
  const rateFlashcard = useRateFlashcard();

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [done, setDone] = useState(false);

  if (isLoading) return <Spinner label="Loading flashcards…" />;
  if (error) return <ErrorBanner message={(error as Error).message} />;
  if (!concept) return <ErrorBanner message="This concept could not be found." />;

  const cards = (concept.practiceQuestions ?? []).slice(0, MAX_CARDS);

  function restart() {
    setIndex(0);
    setRatings([]);
    setDone(false);
    setFlipped(false);
  }

  function rate(rating: Rating) {
    const card = cards[index];
    if (!card) return;
    setRatings((prev) => [...prev, rating]);
    // The rating is written server-side so the learner keeps the record
    // between sessions (the concept page shows it as a badge).
    rateFlashcard.mutate({ questionId: card.id, rating });
    if (index >= cards.length - 1) {
      setDone(true);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  if (cards.length === 0) {
    return (
      <div className="space-y-6">
        <ConceptBreadcrumb concept={concept} conceptId={conceptId} />
        <Card className="py-16 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-surface-300" />
          <p className="mt-4 text-sm font-medium text-surface-700">
            No flashcards available for this concept.
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/app/learn/concepts/${conceptId}`}>Back to the concept</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (done) {
    const pct = recalledPercent(ratings);
    return (
      <div className="space-y-6">
        <ConceptBreadcrumb concept={concept} conceptId={conceptId} />
        <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-purple-50">
          <CardContent className="flex flex-col items-center p-10 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
              <RotateCcw className="h-9 w-9 text-brand-600" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-surface-900">Session complete</h1>
            <p className="mt-1 text-sm text-surface-500">You rated {ratings.length} cards</p>
            <div className="mt-6 rounded-2xl bg-white px-10 py-5 shadow-card">
              <p className="text-3xl font-extrabold text-brand-600">{pct}%</p>
              <p className="mt-1 text-xs text-surface-500">recalled well</p>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href={`/app/learn/concepts/${conceptId}`}>Back to the concept</Link>
              </Button>
              <Button onClick={restart}>
                <RotateCcw className="mr-2 h-4 w-4" /> Restart
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const card = cards[index];
  const previousRating = concept.flashcardRatings?.[card.id];

  return (
    <div className="space-y-6">
      <ConceptBreadcrumb concept={concept} conceptId={conceptId} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Flashcards</h1>
          <p className="mt-1 text-sm text-surface-500">
            {concept.name} · Card {index + 1} of {cards.length}
          </p>
        </div>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {cards.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 w-2 rounded-full transition-colors',
                i <= index ? 'bg-brand-600' : 'bg-surface-200',
              )}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        aria-label={flipped ? 'Answer side. Tap to flip back to the question.' : 'Question side. Tap to reveal the answer.'}
        aria-pressed={flipped}
        className={cn(
          'relative flex min-h-[280px] w-full flex-col items-center justify-center rounded-3xl border-2 bg-white p-8 text-center shadow-card transition-all hover:shadow-lg',
          flipped ? 'border-brand-300' : 'border-brand-100',
        )}
      >
        <div className="absolute right-6 top-6 flex items-center gap-2">
          {previousRating ? (
            <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-surface-500">
              {previousRating}
            </span>
          ) : null}
          <span className="rounded-full bg-surface-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-surface-500">
            {flipped ? 'Answer' : 'Question'}
          </span>
        </div>
        <p
          className={cn(
            'mt-6 max-w-2xl text-surface-900',
            flipped ? 'text-lg font-medium leading-relaxed' : 'text-xl font-semibold leading-8',
          )}
        >
          {flipped ? answerFor(card) : (card.text ?? 'Question')}
        </p>
        {flipped && card.explanation ? (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-surface-500">{card.explanation}</p>
        ) : null}
        <p className="mt-8 text-xs text-surface-400">Tap to flip</p>
      </button>

      {flipped ? (
        <div className="flex flex-wrap gap-2">
          {RATINGS.map((option) => (
            <Button
              key={option.rating}
              variant="ghost"
              className={cn('flex-1 rounded-xl px-3 py-2 text-sm font-medium', option.className)}
              onClick={() => rate(option.rating)}
              disabled={rateFlashcard.isPending}
            >
              {option.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="rounded-xl"
            aria-label="Previous card"
            onClick={() => {
              setIndex(Math.max(0, index - 1));
              setFlipped(false);
            }}
            disabled={index === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button
            variant="outline"
            className="rounded-xl"
            aria-label="Next card"
            onClick={() => {
              setIndex(Math.min(cards.length - 1, index + 1));
              setFlipped(false);
            }}
            disabled={index >= cards.length - 1}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function ConceptBreadcrumb({
  concept,
  conceptId,
}: {
  concept: ConceptDetail;
  conceptId: string;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-surface-500">
      <Link href="/app/library" className="transition-colors hover:text-brand-600">
        Library
      </Link>
      <span aria-hidden="true">/</span>
      {concept.chapter?.id ? (
        <Link
          href={`/app/learn/chapters/${concept.chapter.id}`}
          className="transition-colors hover:text-brand-600"
        >
          {concept.chapter.name}
        </Link>
      ) : (
        <span className="text-surface-400">{concept.chapter?.name}</span>
      )}
      <span aria-hidden="true">/</span>
      <Link
        href={`/app/learn/concepts/${conceptId}`}
        className="truncate transition-colors hover:text-brand-600"
      >
        {concept.name}
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-surface-400">Flashcards</span>
    </nav>
  );
}
