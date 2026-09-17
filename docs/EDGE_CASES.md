# SANRO AI — Edge Cases (Master Audit)

Mandatory test matrix. Every phase must verify its relevant category before
closing.

## AUTH
- wrong password · expired JWT · refresh failure · logout · revoked role ·
  changed permissions · disabled user

## TENANCY
- wrong institution · wrong group · direct object-ID access · cross-tenant
  content · cross-tenant student

## STUDENT
- no class · no subject · no content · no assessment · no weak concepts ·
  one weak concept · many weak concepts · insufficient evidence · transferred
  class · multiple devices

## ASSESSMENT
- timeout · duplicate submit · refresh · network loss · app killed · empty
  paper · invalid question · deleted question · edited question after attempt ·
  late attempt

## CONTENT
- duplicate · unpublished · archived · wrong mapping · deleted source ·
  corrupt PDF · OCR failure · huge file · private YouTube · deleted YouTube ·
  broken model · expired signed URL

## AI
- timeout · malformed JSON · hallucination · duplicate questions · wrong answer
  · wrong concept · insufficient source evidence · partial generation

## IMPORT
- duplicate students · duplicate content · malformed CSV · missing columns ·
  invalid email · invalid grade · partial failure · retry

## PARENT
- no child · multiple children · removed relationship · unauthorized learning
  access

## TEACHER
- no class · removed from class · changed subject · unauthorized student

## AR
- no AR support · camera denied · camera unavailable · 3D fallback · huge model
  · corrupt model · missing texture · low memory · offline · interrupted
  download

## PDF
- short paper · long paper · page breaks · answer key · images · print ·
  download · mobile

## MOBILE
- slow network · offline · back button · keyboard · safe area · rotation ·
  background · app termination · stale token

Each verified case is recorded in CHANGELOG / REBUILD_PROGRESS per phase.