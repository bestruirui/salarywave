export interface Settings {
    monthlySalary: number;
    workStartTime: string;
    workEndTime: string;
    lunchBreakStart: string;
    lunchBreakEnd: string;
    payDay: number;
}

export const defaultSettings: Settings = {
    monthlySalary: 10000,
    workStartTime: "09:00",
    workEndTime: "18:00",
    lunchBreakStart: "12:00",
    lunchBreakEnd: "13:00",
    payDay: 15,
};

export function getSettings(): Settings {
    if (typeof window === 'undefined') return defaultSettings;

    try {
        const stored = localStorage.getItem('salary-tracker-settings');
        if (stored) {
            return { ...defaultSettings, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }

    return defaultSettings;
}

export function saveSettings(settings: Settings): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem('salary-tracker-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
} 