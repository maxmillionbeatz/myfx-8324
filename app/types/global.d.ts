// src/global.d.ts
declare global {
    interface Window {
        gtag?: (
            command: "config" | "event" | "js",
            targetId: string,
            params?: Record<string, unknown>
        ) => void;
    }
}
export { };
