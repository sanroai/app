# Chapter Hub — the interaction model (decided 2026-10-22)

**Status:** DECIDED & IMPLEMENTED
**Scope:** what happens when a student clicks a **chapter name**, and how the chapter page is organised.

---

## 1. "Clicking a chapter name" means three different things - and each has its own, unambiguous result

| The name the student clicks | Where it appears | Result |
|---|---|---|
| A **curriculum chapter** (e.g. *Surface Areas and Volumes*) | Library, chapter lists, search | Opens the **chapter hub** (this page) |
| A **concept** (e.g. *Cylinder, Cone, Sphere*) | Inside the chapter hub | Opens the **concept page** (Learn / Practice / Ask) |
| A **video chapter marker** (e.g. *Total Surface Area · 42:38*) | Under a lesson video | **Seeks the player to that timestamp in place** - it never navigates away |

The rule that keeps it readable: a *marker* always carries a visible timestamp and stays
attached to its video; a *chapter* or *concept* is a link that navigates. Nothing looks like
something else.

## 2. Why a chapter page at all

The concept page has no way back up, and a chapter is the unit a teacher assigns and a
student revises. The chapter page is the **parent** of the concept pages and the place where
"what do I do now?" is answered.

## 3. The page: one scroll, five sections, in learning-loop order

No tabs. Tabs hide exactly the things a teacher wants a student to see, and on a phone every
tab is an extra tap. The sections are cards with a clear heading, in this order:

1. **Continue** (the primary action)
   - the first concept that is not yet mastered (or the weakest one), with a single big CTA
   - progress: `X of Y concepts mastered` + a progress bar
   - if everything is mastered: *"Chapter complete - revise any concept"*
2. **Contents** - every concept with its mastery badge, its resource count and a link.
   The spine of the chapter.
3. **Learn** - the chapter's videos (each with its **chapter-marker list**, i.e. the lesson
   split by time) and the study notes, plus **View chapter PDF** (the textbook chapter,
   viewable inside the app).
4. **Practise** - *Practice the whole chapter* (one session over every concept) and the
   honest empty state when the chapter has no questions yet.
5. **Ask** - *Ask SANRO AI about this chapter* with the same suggested prompts the concept
   page offers, scoped to the chapter.

**Overall chapter notes** sit at the top of **Learn**: one markdown summary of the whole
chapter (concept by concept, with the student's own mastery inline) - the "revision sheet"
for the chapter.

## 4. What a student gets that they did not have before

- a **revision sheet** for the whole chapter in one place (notes + mastery inline)
- the **textbook chapter itself**, viewable in the app (PDF)
- **one practice session for the whole chapter**, not one per concept
- **the AI scoped to the chapter**, not just to a concept
- **videos split by time**, so a 40-minute one-shot is navigable
- a clear **"what do I do next"** answer

## 5. Edge cases (all handled, none of them crash the page)

| Situation | Behaviour |
|---|---|
| Chapter has no concepts | Contents empty state; Continue and Practise hidden; PDF still offered |
| Chapter PDF is not on disk | *View chapter PDF* is disabled and says *"PDF not available for this chapter"* |
| Chapter has no videos | Learn shows the notes only |
| A video has no chapter markers | The marker list is simply not rendered |
| Chapter has no questions | *Practice the whole chapter* is disabled: *"No practice questions for this chapter yet"* |
| The student has done nothing | Progress 0%, Continue points at the first concept |
| The AI provider is not configured | The chat screen shows its existing error state; the hub still works |
| The device is offline | The mobile offline banner shows; the hub renders from cache/empty states |
| The student is in another grade | The API answers 403 - the hub never renders another grade's chapter |
| A video id is dead | The player shows the fallback card and the *Open in YouTube* action |
| The marker list is huge | Capped at 24 markers, sorted by start time, duplicates dropped |
| The PDF is huge | Streamed, never buffered into memory |

## 6. The rules the code follows

- one section per concern; a section that has no data renders its own empty state and nothing else
- every action on the page does exactly one thing (open / seek / start a session)
- nothing on the page depends on a marker existing, a PDF existing or an AI key existing
- the chapter page never mutates learning state - only starting a practice session does
