import * as React from 'react';

interface IImageSequenceAnimatorProps {
  /** image width of pixels in number */
  imgWidth: number;
  /** image height of pixels in number */
  imgHeight: number;
  /** query selector to canvas container */
  containerSelector: string;
  /** query selector to sticky container that can be used to calculate distance to top*/
  stickyContainerSelector: string;
  /** image sequence url list */
  imgUrlList: string[];
  /** padding start of frame in sticky container */
  framePaddingStart: number;
  /** padding end of frame in sticky container */
  framePaddingEnd: number;
  /** if concat reverse seq */
  concatReverse: boolean;
  /** show progress  */
  onProgress?: () => void;
}

interface IAnimationState {
  /** all image loaded */
  isAllLoaded: boolean;
  /** container to viewport top */
  containerTop: number;
  /** animation container width */
  containerWidth: number;
  /** animation container height */
  containerHeight: number;
  /** the distance of animation running */
  animationDistance: number;
  /** canvas ctx ref */
  ctx?: CanvasRenderingContext2D;
  /** force react render */
  forceRefresh: () => void;

  currentCanvas?: HTMLCanvasElement;
  offscreenCanvases?: HTMLCanvasElement[];
  imageSequence: CanvasImageSource[];
}

/**
 * when resize, update state
 * @param props
 * @param canvasRef
 * @param state
 * @param dep
 */
const useUpdateState = (
  props: IImageSequenceAnimatorProps,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  state: React.MutableRefObject<IAnimationState>,
  dep: any
) => {
  React.useEffect(() => {
    const resizeHandler = () => {
      if (!canvasRef.current) {
        console.error('canvas not ready');
        return;
      }

      const stickyContainerDOM = document.querySelector(
        props.stickyContainerSelector
      );

      if (!stickyContainerDOM) {
        console.error(
          'check stickyContainerSelector prop: ',
          props.stickyContainerSelector
        );
        return;
      }

      const stickyContainerBox = stickyContainerDOM.getBoundingClientRect();

      const canvasRectBox = canvasRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio;

      canvasRef.current.width = canvasRectBox.width * dpr;
      canvasRef.current.height = canvasRectBox.height * dpr;

      state.current.containerWidth = canvasRectBox.width;
      state.current.containerHeight = canvasRectBox.height;

      state.current.animationDistance =
        stickyContainerBox.height -
        props.framePaddingEnd -
        props.framePaddingStart;

      if (canvasRef.current) {
        state.current.ctx = canvasRef.current.getContext(
          '2d'
        ) as CanvasRenderingContext2D;
        state.current.ctx.scale(dpr, dpr);
      }

      drawImageSequence(props, canvasRef, state);
    };

    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [canvasRef, props, state, dep]);
};

/**
 *  draw function
 * @param props
 * @param canvasRef
 * @param state
 */
function drawImageSequence(
  props: IImageSequenceAnimatorProps,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  state: React.MutableRefObject<IAnimationState>
) {
  if (!canvasRef.current) {
    console.error('canvas not ready');
    return;
  }
  if (!state.current.isAllLoaded) {
    console.warn('all are not loaded');
    return;
  }
  const containerHeight = state.current.containerHeight;
  const containerWidth = state.current.containerWidth;
  const animationDistance = state.current.animationDistance;

  const { imgWidth, imgHeight } = props;

  const sequences = state.current.imageSequence;

  const ctx = state.current.ctx as CanvasRenderingContext2D;

  // offset top is exactly already scrolled vertical range,
  // of canvas' container in sticky container
  let scrollOffset = (document.querySelector(
    props.containerSelector
  ) as HTMLElement).offsetTop;

  if (scrollOffset <= props.framePaddingStart) scrollOffset = 0;

  if (scrollOffset >= animationDistance) scrollOffset = animationDistance - 1;

  const currentIndex = Math.floor(
    (scrollOffset / animationDistance) * sequences.length
  );

  // draw the image
  // as if it's styled by background-size: cover and background-position: center
  let dx, dy, dWidth, dHeight;

  const containerRatio = containerWidth / containerHeight;
  const imgRatio = imgWidth / imgHeight;
  if (imgRatio > containerRatio) {
    // stretch width to fit container height
    dWidth = (containerHeight / imgHeight) * imgWidth;
    dHeight = containerHeight;
    dx = (containerWidth - dWidth) / 2;
    dy = 0;
  } else {
    // stretch height to fit container width
    dWidth = containerWidth;
    dHeight = (containerWidth / imgWidth) * imgHeight;
    dx = 0;
    dy = (containerHeight - dHeight) / 2;
  }

  ctx.drawImage(sequences[currentIndex], dx, dy, dWidth, dHeight);
}

/**
 * update canvas when resize and scrolling
 * draw image based on pageYOffset
 * @param props
 * @param canvasRef
 * @param state
 */
const useUpdateCanvas = (
  props: IImageSequenceAnimatorProps,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  state: React.MutableRefObject<IAnimationState>
) => {
  React.useEffect(() => {
    const scrollHandler = () => {
      drawImageSequence(props, canvasRef, state);
    };

    window.addEventListener('scroll', scrollHandler);

    return () => {
      window.removeEventListener('scroll', scrollHandler);
    };
  }, [canvasRef, props, state]);
};

const useUpdateOffscreenCanvases = (
  props: IImageSequenceAnimatorProps,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  state: React.MutableRefObject<IAnimationState>
) => {
  // todo
};

function loadImagePromise(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = reject;
  });
}

const usePreload = (
  props: IImageSequenceAnimatorProps,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  state: React.MutableRefObject<IAnimationState>
) => {
  // todo
  // preload image sequence as blob
  // save it to IndexedDB
  const { imgUrlList } = props;

  React.useEffect(() => {
    if (props.onProgress) {
    }

    const promises = imgUrlList.map(loadImagePromise);
    Promise.all(promises)
      .then(images => {
        state.current.isAllLoaded = true;
        state.current.imageSequence = images;
        if (props.concatReverse) {
          state.current.imageSequence.push(...images.slice(0).reverse());
        }
        state.current.forceRefresh();
      })
      .catch(e => {
        console.warn(e);
        state.current.isAllLoaded = false;
      });
  }, [canvasRef, imgUrlList, props, state]);
};

const ImageSequenceAnimator: React.FC<IImageSequenceAnimatorProps> = props => {
  const [loaded, toggle] = React.useState<boolean>(false);
  const forceRefresh = React.useCallback(() => {
    toggle(true);
  }, [toggle]);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stateRef = React.useRef<IAnimationState>({
    isAllLoaded: false,
    containerTop: 0,
    containerWidth: 0,
    containerHeight: 0,
    imageSequence: [],
    animationDistance: 0,
    forceRefresh
  });

  // hacky way to let useUpdateState know that
  // loaded state has changed
  const callback = React.useMemo(() => ({}), [loaded]);

  usePreload(props, canvasRef, stateRef);
  useUpdateState(props, canvasRef, stateRef, callback);
  useUpdateCanvas(props, canvasRef, stateRef);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        background: `${loaded ? 'black' : 'gray'}`
      }}
    />
  );
};

export default ImageSequenceAnimator;
