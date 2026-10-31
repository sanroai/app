import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChapterMarkerStrip } from './ChapterMarkerStrip';
import { seekScript } from './YouTubePlayer';

// the real WebView needs a native module that does not exist under jest
jest.mock('react-native-webview', () => ({ WebView: 'WebView', default: 'WebView' }));

const segments = [
  { title: 'Introduction', startSeconds: 0 },
  { title: 'Total Surface Area', startSeconds: 2558 },
];

describe('ChapterMarkerStrip (chapter-marker strip under a video lesson)', () => {
  it('renders one chip per marker with its timestamp', () => {
    render(<ChapterMarkerStrip segments={segments} />);
    expect(screen.getByText('Introduction')).toBeTruthy();
    expect(screen.getByText('Total Surface Area')).toBeTruthy();
    expect(screen.getByText('00:00')).toBeTruthy();
    expect(screen.getByText('42:38')).toBeTruthy();
  });

  it('seeks the player to the marker that was tapped', () => {
    const onSelect = jest.fn();
    render(<ChapterMarkerStrip segments={segments} onSelect={onSelect} />);
    fireEvent.press(screen.getByText('Total Surface Area'));
    expect(onSelect).toHaveBeenCalledWith(2558);
  });

  it('renders nothing when the video has no markers', () => {
    const { toJSON } = render(<ChapterMarkerStrip segments={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when the markers are missing altogether', () => {
    const { toJSON } = render(<ChapterMarkerStrip segments={null} />);
    expect(toJSON()).toBeNull();
  });

  it('starts collapsed on the chapter hub and opens on tap', () => {
    render(<ChapterMarkerStrip segments={segments} collapsible />);

    expect(screen.getByText(/2 sections/)).toBeTruthy();
    expect(screen.queryByText('Total Surface Area')).toBeNull();

    fireEvent.press(screen.getByText(/2 sections/));
    expect(screen.getByText('Total Surface Area')).toBeTruthy();
  });
});

describe('seekScript (jump inside the YouTube iframe)', () => {
  it('posts a seekTo command to the embedded player', () => {
    expect(seekScript(2558)).toContain("document.getElementById('player')");
    expect(seekScript(2558)).toContain("func:'seekTo'");
    expect(seekScript(2558)).toContain('args:[2558]');
  });

  it('never seeks to a negative offset', () => {
    expect(seekScript(-10)).toContain('args:[0]');
  });
});
