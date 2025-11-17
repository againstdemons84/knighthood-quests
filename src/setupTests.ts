import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: class IntersectionObserver {
        constructor() {}
        disconnect() {}
        observe() {}
        unobserve() {}
    }
});

Object.defineProperty(global, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: class IntersectionObserver {
        constructor() {}
        disconnect() {}
        observe() {}
        unobserve() {}
    }
});

// Suppress console errors for cleaner test output
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
             args[0].includes('Failed to calculate metrics for scenario') ||
             args[0].includes('Error loading workout metrics for'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});