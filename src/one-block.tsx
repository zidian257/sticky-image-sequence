import * as React from 'react';
import { animated } from 'react-spring';
import style from './timeline.module.css';
import { LoremIpsum } from 'lorem-ipsum';

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
});

const breakLine = (str: string) => {
  const regex = ',';
  return str.split(regex).map((frag, index) => (
    <React.Fragment key={frag}>
      {index === 0 ? '' : <br />}
      {frag}
    </React.Fragment>
  ));
};

export interface ITimeLineItem {
  title: string;
  content: string;
}

export const data = Array(11)
  .fill(1)
  .map((value) => ({
    title: lorem.generateWords(1),
    content: lorem.generateWords(3),
  })) as ITimeLineItem[];

interface ITimeLineBlockProps {
  item: ITimeLineItem;
  left: boolean;
  styles: any;
}

export const OneBlock: React.FC<ITimeLineBlockProps> = ({
  styles,
  item,
  left,
}) => (
  <animated.div className={left ? style.leftBlock : style.rightBlock}>
    <animated.div
      className={left ? style.leftAxis : style.rightAxis}
      style={{ height: styles.axisHeight }}
    />
    <animated.div
      className={left ? style.leftDot : style.rightDot}
      style={{ transform: styles.dotTransform }}
    />
    <animated.div
      className={style.header}
      style={{
        filter: styles.contentFilter,
        opacity: styles.contentOpacity,
      }}
    >
      {item.title}
    </animated.div>
    <animated.div
      className={style.main}
      style={{
        filter: styles.contentFilter,
        opacity: styles.contentOpacity,
      }}
    >
      {breakLine(item.content)}
    </animated.div>
  </animated.div>
);
