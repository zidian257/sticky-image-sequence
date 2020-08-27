import * as React from "react";
import "./App.css";
import ImageSequenceAnimator from "./image-sequence-animator";

let imageList: string[] = [];

for (let i = 0; i < 201; i++) {
  imageList.push(
      process.env.PUBLIC_URL + `/assets/REAL_${i.toString().padStart(4, "0")}.jpg`
  );
}

function App() {
  return (
    <div>
      <div className="stickyParent">
        <div className="sticky">
          <ImageSequenceAnimator
            containerSelector={`.sticky`}
            framePaddingEnd={0}
            framePaddingStart={0}
            imgWidth={1902}
            imgHeight={1080}
            stickyContainerSelector={`.stickyParent`}
            concatReverse
            imgUrlList={imageList}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
