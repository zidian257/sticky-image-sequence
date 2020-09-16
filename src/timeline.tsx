import * as React from 'react';
import { useTransition, config as cf } from 'react-spring';
import style from './timeline.module.css';
import { data, ITimeLineItem, OneBlock } from './one-block';

const Index = ({ inView }: { inView: boolean }) => {
  const open = React.useMemo(() => inView, [inView]);
  const config = open ? {} : { duration: 0 };
  const trail = open ? 1000 : 0;
  // @ts-ignore
  const transitions = useTransition(
    open ? data : [],
    (item: ITimeLineItem) => item.title,
    {
      config,
      trail,
      from: {
        contentFilter: 'blur(20px)',
        contentOpacity: 0,
        dotTransform: `scale(0)`,
        axisHeight: `0%`,
      },
      enter: [
        {
          contentOpacity: 1,
          contentFilter: 'blur(0px)',
          dotTransform: `scale(0.9)`,
        },
        { axisHeight: `100%` },
      ],
      update: [
        {
          contentOpacity: 1,
          contentFilter: 'blur(0px)',
          dotTransform: `scale(0.9)`,
        },
        { axisHeight: `100%` },
      ],
      leave: {
        contentOpacity: 0,
        dotTransform: `scale(0)`,
        contentFilter: 'blur(200px)',
        axisHeight: `0%`,
      },
    }
  );

  // @ts-ignore
  return (
    <div>
      <div className={style.timeline}>
        {transitions.map(({ item, props, key }, index) => (
          <OneBlock
            key={key}
            styles={props}
            item={item}
            left={index % 2 === 1}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
