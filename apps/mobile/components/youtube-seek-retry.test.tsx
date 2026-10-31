import { act, fireEvent, render, screen } from '@testing-library/react-native';
import {
  createElement as mockCreateElement,
  forwardRef as mockForwardRef,
  useImperativeHandle as mockUseImperativeHandle,
} from 'react';
import { Text as mockText } from 'react-native';
import { YouTubePlayer } from './YouTubePlayer';

// the real WebView needs a native module that does not exist under jest
const mockInjectJavaScript = jest.fn();
let mockLoadEnd: (() => void) | null = null;

jest.mock('react-native-webview', () => {
  const WebView = mockForwardRef((props: any, ref: any) => {
    mockUseImperativeHandle(ref, () => ({
      injectJavaScript: (script: string) => mockInjectJavaScript(script),
    }));
    mockLoadEnd = props.onLoadEnd;
    return mockCreateElement(mockText, { testID: 'webview' }, 'player');
  });
  WebView.displayName = 'WebView';
  return { WebView, default: WebView };
});

const segments = [
  { title: 'Introduction', startSeconds: 0 },
  { title: 'Total Surface Area', startSeconds: 2558 },
];

describe('YouTubePlayer (chapter marker seek)', () => {
  beforeEach(() => {
    mockInjectJavaScript.mockClear();
    mockLoadEnd = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('repeats the seek command, because the iframe can be late', () => {
    render(<YouTubePlayer videoId="dQw4w9WgXcQ" title="Surface Areas" segments={segments} />);

    // the marker starts the player and remembers the offset
    fireEvent.press(screen.getByText('Total Surface Area'));
    // the wrapper reports "loaded" - the YouTube iframe inside it may still be
    // starting up, so the first command can be dropped
    act(() => {
      mockLoadEnd?.();
    });
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(2);

    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(3);

    // three attempts, then it stops
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(mockInjectJavaScript).toHaveBeenCalledTimes(3);

    expect(mockInjectJavaScript.mock.calls[0][0]).toContain('args:[2558]');
  });

  it('does not seek when no marker was tapped', () => {
    render(<YouTubePlayer videoId="dQw4w9WgXcQ" title="Surface Areas" segments={segments} />);
    act(() => {
      mockLoadEnd?.();
    });
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });
});
