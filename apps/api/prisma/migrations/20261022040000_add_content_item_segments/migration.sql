-- Chapter markers of a video lesson, so a long lesson can be split by time:
-- [{ "title": "Total Surface Area", "startSeconds": 2558 }]
ALTER TABLE "ContentItem" ADD COLUMN "segments" JSONB;
