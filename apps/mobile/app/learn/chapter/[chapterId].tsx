import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * The chapter hub now lives at `/chapter/[chapterId]`. This route is kept so
 * the old deep links (and anything already bookmarked) still land on the hub
 * instead of a screen built for the previous chapter payload.
 */
export default function LegacyChapterRoute() {
  const { chapterId = '' } = useLocalSearchParams<{ chapterId: string }>();
  return <Redirect href={{ pathname: '/chapter/[chapterId]', params: { chapterId } }} />;
}
