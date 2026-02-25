export interface GameSettings {
  Game: {
    TapSpeed: number;
    TouchSpeed: number;
    SlideFadeInOffset: number;
    BackgroundDim: number;
    StarRotation: boolean;
    BGInfo: string;
    TopInfo: string;
    TrackSkip: boolean;
    FastRetry: boolean;
    Mirror: string;
    Rotation: number;
    Random: string;
    RecordMode: string;
  };
  Judge: {
    AudioOffset: number;
    JudgeOffset: number;
    AnswerOffset: number;
    TouchPanelOffset: number;
    Mode: string;
  };
  Display: {
    Language: string;
    Skin: string;
    DisplayCriticalPerfect: boolean;
    DisplayBreakScore: boolean;
    FastLateType: string;
    NoteJudgeType: string;
    TouchJudgeType: string;
    SlideJudgeType: string;
    BreakJudgeType: string;
    BreakFastLateType: string;
    SlideSortOrder: string;
    OuterJudgeDistance: number;
    InnerJudgeDistance: number;
    DisplayHoldHeadJudgeResult: boolean;
    TapScale: number;
    HoldScale: number;
    TouchScale: number;
    SlideScale: number;
    TouchFeedback: string;
    Resolution: string;
    MainScreenPosition: number;
    RenderQuality: string;
    Topmost: boolean;
    FPSLimit: number;
    VSync: boolean;
  };
  Audio: {
    ForceMono: boolean;
    Volume: {
      Global: number;
      Answer: number;
      BGM: number;
      Track: number;
      Tap: number;
      Slide: number;
      Break: number;
      Touch: number;
      Voice: number;
    };
    Wasapi: {
      Exclusive: boolean;
      RawMode: boolean;
      BufferSize: number;
      Period: number;
    };
    Asio: {
      DeviceIndex: number;
      SampleRate: number;
    };
    Channel: {
      Main: string;
    };
    Backend: string;
  };
  Debug: {
    DisplaySensor: boolean;
    TouchSimulationRadius: number;
    TouchAAreaExtraRadius: number;
    TouchBAreaExtraRadius: number;
    TouchCAreaExtraRadius: number;
    TouchDAreaExtraRadius: number;
    TouchEAreaExtraRadius: number;
    DisplayFPS: boolean;
    FullScreen: boolean;
    MenuOptionIterationSpeed: number;
    DisplayOffset: number;
    NoteAppearRate: number;
    OffsetUnit: string;
    HideCursorInGame: boolean;
    NoteFolding: boolean;
    DJAutoPolicy: string;
    MaxQueuedFrames: number;
    TapPoolCapacity: number;
    HoldPoolCapacity: number;
    TouchPoolCapacity: number;
    TouchHoldPoolCapacity: number;
    EachLinePoolCapacity: number;
    DebugLevel: string;
  };
  Online: {
    Enable: boolean;
    UseProxy: boolean;
    Proxy: string;
    ApiEndpoints: Array<{
      Name: string;
      Url: string;
      Username: string;
      Password: string;
    }>;
  };
  IO: {
    Manufacturer: string | null;
    InputDevice: any; // 简化处理
    OutputDevice: any; // 简化处理
  };
}
