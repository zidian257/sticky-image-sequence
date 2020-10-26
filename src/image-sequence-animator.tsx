import * as React from 'react';

interface IImageSequenceAnimatorProps {
  /** image width of pixels in number */
  imgWidth: number;
  /** image height of pixels in number */
  imgHeight: number;
  /** query selector to canvas container */
  containerSelector: string;
  /** query selector to scene element that can be used to calculate distance to top,
   *  usually it's parent of the sticky element
   * */
  sceneSelector: string;
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
  // isAllLoaded: boolean;
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
  // forceRefresh: () => void;

  currentCanvas?: HTMLCanvasElement;
  offscreenCanvases?: HTMLCanvasElement[];
  imageSequence: CanvasImageSource[];
}

/**
 * when resize, update state
 * @param props
 * @param canvasRef
 * @param state
 */
const useUpdateState = (
  props: IImageSequenceAnimatorProps,
  canvasRef: React.RefObject<HTMLCanvasElement>,
  setState: React.Dispatch<React.SetStateAction<IAnimationState>>
) => {
  React.useEffect(() => {
    // console.log('effect called');
    const resizeHandler = () => {
      if (!canvasRef.current) {
        console.error('canvas not ready');
        return;
      }

      const stickyContainerDOM = document.querySelector(props.sceneSelector);

      if (!stickyContainerDOM) {
        console.error('check sceneSelector prop: ', props.sceneSelector);
        return;
      }

      const stickyContainerBox = stickyContainerDOM.getBoundingClientRect();

      const canvasRectBox = canvasRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio;

      canvasRef.current.width = canvasRectBox.width * dpr;
      canvasRef.current.height = canvasRectBox.height * dpr;

      setState(prevState => {
        prevState.containerWidth = canvasRectBox.width;
        prevState.containerHeight = canvasRectBox.height;

        prevState.animationDistance =
          stickyContainerBox.height -
          props.framePaddingEnd -
          props.framePaddingStart;

        if (canvasRef.current) {
          prevState.ctx = canvasRef.current.getContext(
            '2d'
          ) as CanvasRenderingContext2D;
          prevState.ctx.scale(dpr, dpr);
        }

        // 这里有些脏
        // 假设要重构，那么应该考虑渲染所需内容不放在入参而放在作用域上，比如用useCallback
        // 如果觉得useCallback会导致重渲判定那么可以配合useRef进行state缓存，参考：
        // https://ahooks.js.org/hooks/advanced/use-persist-fn
        drawImageSequence(props, canvasRef, prevState);

        return prevState
      })

    };

    resizeHandler();
    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
    };
  }, [canvasRef, props, setState]);
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
  state: IAnimationState
) {
  if (!canvasRef.current) {
    console.error('canvas not ready');
    return;
  }
  // if (!state.current.isAllLoaded) {
  //   console.warn('all are not loaded');
  //   return;
  // }
  const containerHeight = state.containerHeight;
  const containerWidth = state.containerWidth;
  const animationDistance = state.animationDistance;

  const { imgWidth, imgHeight } = props;

  const sequences = state.imageSequence;

  const ctx = state.ctx as CanvasRenderingContext2D;

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

  if (sequences[currentIndex]) {
    ctx.drawImage(sequences[currentIndex], dx, dy, dWidth, dHeight);
  } else {
    ctx.clearRect(0, 0, dWidth, dHeight)
  }

  console.count('draw')
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
  state: IAnimationState,
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

function loadImage(url: string): Promise<HTMLImageElement> {
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
  setState: React.Dispatch<React.SetStateAction<IAnimationState>>
) => {
  // preload images
  // and then force the state change and draw
  const { imgUrlList } = props;

  React.useEffect(() => {
    // if (props.onProgress) {
    // }

    let nextFrame = 0

    const imgUrlListLen = imgUrlList.length

    imgUrlList.forEach((img, idx) => loadImage(img).then((imageEle) => {
      setState(prevState => {
        if (props.concatReverse) {
          prevState.imageSequence[imgUrlListLen - 1 - idx] = imageEle
        } else {
          prevState.imageSequence[idx] = imageEle
        }

        prevState.imageSequence = [...prevState.imageSequence]

        console.count('image load')

        return prevState
      })

      cancelAnimationFrame(nextFrame)
      nextFrame = requestAnimationFrame(() => {
        window.dispatchEvent(new Event('scroll'))
      })
    }))

  }, [imgUrlList, props.concatReverse, setState]);
};

const ImageSequenceAnimator: React.FC<IImageSequenceAnimatorProps> = (
  props
) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [state, setState] = React.useState<IAnimationState>({
    containerTop: 0,
    containerWidth: 0,
    containerHeight: 0,
    imageSequence: [],
    animationDistance: 0,
  })
  usePreload(props, setState);
  useUpdateState(props, canvasRef, setState);
  useUpdateCanvas(props, canvasRef, state);

  console.count('render')

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        background: 'gray',
      }}
    />
  );
};

export default ImageSequenceAnimator;
