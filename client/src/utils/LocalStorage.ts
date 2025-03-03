export function setLocalStorage(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalStorage(key: string): any | null {
    const value = localStorage.getItem(key);
    if (value === null) {
        return null;
    }
    return JSON.parse(value);
}

export function hasLocalStorage(key: string): boolean {
    return localStorage.getItem(key) !== null;
}

export function removeLocalStorage(key: string): void {
    localStorage.removeItem(key);
}

