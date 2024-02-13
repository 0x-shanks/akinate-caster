import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
  getFrameMessage,
} from "frames.js/next/server";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";
import { Aki } from "aki-api";

type State = {
  a: number; //active
  st: number; //step
  se: string; //session
  si: string; //signature
  u: string; //uid
  f: string; //frontaddr
};

const initialState = {
  a: 0,
  st: 0,
  se: "",
  si: "",
  u: "",
  f: "",
};

const reducer: FrameReducer<State> = (state, action) => {
  return {
    a: action.postBody?.untrustedData.buttonIndex
      ? action.postBody?.untrustedData.buttonIndex
      : 0,
    st: state.st,
    se: state.se,
    si: state.si,
    u: state.u,
    f: state.f,
  };
};

export type guess = {
  id: string;
  name: string;
  id_base: string;
  proba: string;
  absolute_picture_path: string;
  award_id: string;
  corrupt: string;
  description: string;
  picture_path: string;
  pseudo: string;
  ranking: string;
  relative: string;
  valide_contrainte: string;
  nsfw?: boolean;
};
interface winResult {
  guessCount: number;
  guesses: guess[];
}

// This is a react server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);

  // const frameMessage = await getFrameMessage(previousFrame.postBody, {
  //   ...DEBUG_HUB_OPTIONS,
  // });

  // if (frameMessage && !frameMessage?.isValid) {
  //   if (frameMessage) {
  //     const {
  //       isValid,
  //       buttonIndex,
  //       inputText,
  //       castId,
  //       requesterFid,
  //       casterFollowsRequester,
  //       requesterFollowsCaster,
  //       likedCast,
  //       recastedCast,
  //       requesterVerifiedAddresses,
  //       requesterUserData,
  //     } = frameMessage;

  //     console.log("info: frameMessage is:", frameMessage);
  //   }
  //   throw new Error("Invalid frame payload");
  // }

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  // console.log("info: state is:", state);

  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

  const region = "en";
  const childMode = true;

  let aki: Aki;
  if (state.se == "") {
    aki = new Aki({
      region,
      childMode,
    });
    await aki.start();
  } else {
    aki = new Aki({
      region,
      childMode,
      currentStep: state.st,
      session: state.se,
      signature: state.si,
      uid: state.u,
      frontaddr: state.f,
    });
    await aki.startWithoutSession();
    await aki.step(state?.a <= 2 ? state?.a - 1 : state?.a);
  }

  const isEnd = aki.progress >= 90 || aki.currentStep >= 78;
  let result: winResult | undefined = undefined;

  if (isEnd) {
    result = await aki.win();
    console.log("result:", result);
    console.log("firstGuess:", aki.answers);
  }

  // then, when done, return next frame
  return (
    <div className="p-4">
      <div className="mb-8">
        <p className="text-3xl font-bold">AkinateCaster</p>
        <p>
          AkinateCaster is an extension that allows akinator to be used in a
          frame.
        </p>
        <p>This is only available in Warpcast</p>
      </div>

      <img alt="bg" className="mb-12 w-64 h-64 rounded-lg" src="/genie.png" />

      <div className="mb-12">
        <p className="text-lg font-bold">Author</p>
        <a href="https://warpcast.com/nakaj1ma">
          <div className="flex items-center space-x-4">
            <img src="/profile.png" className="w-10 h-10 rounded-full" />
            <p>0xshanks</p>
          </div>
        </a>
      </div>

      <FrameContainer
        postUrl={`${baseUrl}/frames`}
        state={{
          ...state,
          st: aki.currentStep,
          se: aki.session ?? "",
          si: aki.signature ?? "",
          u: aki.uid ?? "",
          f: aki.frontaddr ?? "",
        }}
        previousFrame={previousFrame}
        pathname="/"
      >
        <FrameImage aspectRatio="1:1">
          {isEnd ? (
            <div tw="display: flex relative w-full h-full">
              <img
                style={{ objectFit: "cover" }}
                alt="bg"
                tw="absolute w-full h-full "
                src={result?.guesses[0]?.absolute_picture_path}
              />
              {/* <div tw="absolute top-0 right-0 display: flex justify-center items-center text-4xl px-20 pb-8 pt-4 bg-black/50 text-white text-wrap text-center">
                {"Progress: " + aki.progress}
              </div> */}
              <div tw="absolute bottom-0 w-full display: flex justify-center items-center text-8xl px-20 pb-8 pt-4 bg-black/50 text-white text-wrap text-center">
                {"I think of " + result?.guesses[0]?.name ?? ""}
              </div>
            </div>
          ) : (
            <div tw="display: flex relative w-full h-full">
              <img
                style={{ objectFit: "cover" }}
                alt="bg"
                tw="absolute w-full h-full "
                src={`${baseUrl}/genie.png`}
              />
              {/* <div tw="absolute top-0 right-0 display: flex justify-center items-center text-4xl px-20 pb-8 pt-4 bg-black/50 text-white text-wrap text-center">
                {"Progress: " + aki.progress}
              </div> */}
              <div tw="absolute bottom-0 w-full display: flex justify-center items-center text-8xl px-20 pb-8 pt-4 bg-black/50 text-white text-wrap text-center">
                {`Q${aki.currentStep + 1}: ${aki.question}`}
              </div>
            </div>
          )}
        </FrameImage>

        {!!aki.answers[0] && !isEnd ? (
          <FrameButton>{aki.answers[0] as string}</FrameButton>
        ) : null}

        {!!aki.answers[1] && !isEnd ? (
          <FrameButton>{aki.answers[1] as string}</FrameButton>
        ) : null}

        {!!aki.answers[3] && !isEnd ? (
          <FrameButton>{aki.answers[3] as string}</FrameButton>
        ) : null}

        {!!aki.answers[4] && !isEnd ? (
          <FrameButton>{aki.answers[4] as string}</FrameButton>
        ) : null}
      </FrameContainer>
    </div>
  );
}
