import { PageSkeleton } from '@/components/route-skeletons';

export default function LibraryLoading() {
  return <PageSkeleton titleWidth="w-40" subtitleWidth="w-96" cards={8} columns={3} />;
}
