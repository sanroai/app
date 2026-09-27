import { describe, expect, it } from 'vitest';
import { parseYouTubeVideoId, youtubeThumbnailUrl } from './content.service';

describe('parseYouTubeVideoId', () => {
  it('parses canonical watch URLs', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('parses watch URLs with extra params', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?list=PL123&v=abcDEF12345&t=42s')).toBe('abcDEF12345');
  });

  it('parses youtu.be short links', () => {
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ');
  });

  it('parses embed, shorts and live paths', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('accepts bare ids without a scheme', () => {
    expect(parseYouTubeVideoId('youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('accepts mobile and no-cookie hosts', () => {
    expect(parseYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('rejects non-YouTube hosts', () => {
    expect(parseYouTubeVideoId('https://vimeo.com/12345')).toBeNull();
    expect(parseYouTubeVideoId('https://evil.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseYouTubeVideoId('https://youtube.com.evil.net/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('rejects URLs without a video id', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/')).toBeNull();
    expect(parseYouTubeVideoId('https://www.youtube.com/watch')).toBeNull();
    expect(parseYouTubeVideoId('https://www.youtube.com/results?search_query=physics')).toBeNull();
  });

  it('rejects malformed or non-http input', () => {
    expect(parseYouTubeVideoId('')).toBeNull();
    expect(parseYouTubeVideoId('   ')).toBeNull();
    expect(parseYouTubeVideoId('not a url')).toBeNull();
    expect(parseYouTubeVideoId('javascript:alert(1)')).toBeNull();
    expect(parseYouTubeVideoId('ftp://youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });

  it('rejects ids that fail the id pattern', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=')).toBeNull();
    expect(parseYouTubeVideoId('https://youtu.be/../../etc/passwd')).toBeNull();
  });
});

describe('youtubeThumbnailUrl', () => {
  it('builds the i.ytimg.com thumbnail', () => {
    expect(youtubeThumbnailUrl('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg');
  });
});
