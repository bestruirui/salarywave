export interface HolidayInfo {
    holiday: boolean;
    name: string;
    wage: number;
    date: string;
    rest?: number;
    after?: boolean;
    target?: string;
}

export interface HolidayApiResponse {
    code: number;
    holiday: Record<string, HolidayInfo>;
}

let holidayCache: Record<string, HolidayInfo> | null = null;
let cacheYear: number | null = null;

export async function getHolidayData(year: number): Promise<Record<string, HolidayInfo>> {
    // 如果缓存中有当年数据，直接返回
    if (holidayCache && cacheYear === year) {
        return holidayCache;
    }

    try {
        const response = await fetch(`https://timor.tech/api/holiday/year/${year}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: HolidayApiResponse = await response.json();

        if (data.code === 0 && data.holiday) {
            // 将MM-dd格式转换为yyyy-MM-dd格式
            const processedHolidays: Record<string, HolidayInfo> = {};

            Object.entries(data.holiday).forEach(([key, value]) => {
                const fullDate = `${year}-${key}`;
                processedHolidays[fullDate] = {
                    ...value,
                    date: fullDate
                };
            });

            // 更新缓存
            holidayCache = processedHolidays;
            cacheYear = year;

            return processedHolidays;
        }

        throw new Error('Invalid API response');
    } catch (error) {
        console.error('Failed to fetch holiday data:', error);

        // 返回空对象作为fallback
        return {};
    }
}

export function getHolidayInfo(date: Date): HolidayInfo | null {
    if (!holidayCache) {
        return null;
    }

    const dateStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

    return holidayCache[dateStr] || null;
}

// 判断是否为工作日（考虑节假日和调休）
export function isWorkdayWithHoliday(date: Date, holidayData: Record<string, HolidayInfo>): boolean {
    const dateStr = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');

    const holidayInfo = holidayData[dateStr];

    if (holidayInfo) {
        // 如果有节假日信息，holiday为true表示放假，false表示补班
        return !holidayInfo.holiday;
    }

    // 没有节假日信息，按正常周末判断
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // 0=周日, 6=周六
}

// 获取下一个节假日
export function getNextHoliday(holidayData: Record<string, HolidayInfo>): { date: Date; name: string } | null {
    const now = new Date();
    const currentDateStr = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0');

    const upcomingHolidays = Object.entries(holidayData)
        .filter(([dateStr, info]) =>
            dateStr > currentDateStr &&
            info.holiday === true // 只要真正的节假日，不要补班日
        )
        .sort(([a], [b]) => a.localeCompare(b));

    if (upcomingHolidays.length === 0) {
        return null;
    }

    const [dateStr, holidayInfo] = upcomingHolidays[0];
    const [year, month, day] = dateStr.split('-').map(Number);

    return {
        date: new Date(year, month - 1, day),
        name: holidayInfo.name
    };
} 