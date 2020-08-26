import * as React from "react";
import "./App.css";
import ImageSequenceAnimator from "./image-sequence-animator";

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
            // onProgress={setProgress}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
