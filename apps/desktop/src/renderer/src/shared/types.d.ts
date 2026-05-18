export {};

declare module "*.css";

declare global {
  interface Window {
    appShell: {
      platform: NodeJS.Platform;
      versions: {
        chrome: string;
        electron: string;
        node: string;
      };
    };
  }
}
