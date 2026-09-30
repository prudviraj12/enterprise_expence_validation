import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

class Observer {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: Observer, writable: true });
Object.defineProperty(globalThis, "IntersectionObserver", { value: Observer, writable: true });
Object.defineProperty(window, "matchMedia", {
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});
Object.defineProperty(globalThis, "createImageBitmap", {
  value: vi.fn().mockResolvedValue({ width: 1200, height: 1600, close: vi.fn() }),
  writable: true,
});
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: vi.fn(), writable: true });
Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { value: vi.fn().mockReturnValue(false), writable: true });
Object.defineProperty(HTMLElement.prototype, "setPointerCapture", { value: vi.fn(), writable: true });
Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { value: vi.fn(), writable: true });
