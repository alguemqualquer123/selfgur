// env.d.ts
declare namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      HOST?: string;
    }
  }
  