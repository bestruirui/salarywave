import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWeekend, addMonths } from 'date-fns';
import { Settings } from './storage';
import { HolidayInfo, getHolidayData, isWorkdayWithHoliday, getNextHoliday } from './holiday-api';

// 节假日数据存储
let currentHolidayData: Record<string, HolidayInfo> = {};
let isHolidayDataLoaded = false;

// 初始化节假日数据
export async function initializeHolidayData(): Promise<void> {
    const currentYear = new Date().getFullYear();
    try {
        currentHolidayData = await getHolidayData(currentYear);
        isHolidayDataLoaded = true;
    } catch (error) {
        console.error('Failed to initialize holiday data:', error);
        isHolidayDataLoaded = false;
    }
}

// 时间转换函数
export function timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 判断是否为工作日
export function isWorkday(date: Date): boolean {
    if (isHolidayDataLoaded) {
        return isWorkdayWithHoliday(date, currentHolidayData);
    }

    // fallback到基本的周末判断
    return !isWeekend(date);
}

// 计算下次发薪日
export function getNextPayday(settings: Settings): Date {
    const now = new Date();
    let nextPayday = new Date(now.getFullYear(), now.getMonth(), settings.payDay);

    if (nextPayday <= now) {
        nextPayday = addMonths(nextPayday, 1);
    }

    return nextPayday;
}

// 格式化倒计时显示
export function formatCountdown(timestamp: number, celebrationText?: string): string {
    if (timestamp <= 0) {
        return celebrationText || '已到达';
    }

    const seconds = Math.floor(timestamp / 1000);
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    if (days > 0) {
        return `${days} 天 ${hours} 小时 ${minutes} 分钟 ${secs} 秒`;
    } else if (hours > 0) {
        return `${hours} 小时 ${minutes} 分钟 ${secs} 秒`;
    } else if (minutes > 0) {
        return `${minutes} 分钟 ${secs} 秒`;
    } else {
        return `${secs} 秒`;
    }
}

// 获取节假日数据状态
export function getHolidayDataStatus(): { loaded: boolean; dataCount: number } {
    return {
        loaded: isHolidayDataLoaded,
        dataCount: Object.keys(currentHolidayData).length
    };
}

// 获取当前时间戳
export function getCurrentTimestamp(): number {
    return Date.now();
}

// 时间字符串转时间戳
export function timeStringToTimestamp(timeStr: string, date: Date = new Date()): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const timestamp = new Date(date);
    timestamp.setHours(hours, minutes, 0, 0);
    return timestamp.getTime();
}

// 获取工作日时间戳范围
export function getWorkdayTimestampRange(settings: Settings, date: Date = new Date()): { start: number; end: number; lunchStart: number; lunchEnd: number } | null {
    if (!isWorkday(date)) {
        return null;
    }

    return {
        start: timeStringToTimestamp(settings.workStartTime, date),
        end: timeStringToTimestamp(settings.workEndTime, date),
        lunchStart: timeStringToTimestamp(settings.lunchBreakStart, date),
        lunchEnd: timeStringToTimestamp(settings.lunchBreakEnd, date)
    };
}

// 计算指定月份的实际工作日数
function getMonthWorkdays(date: Date, holidayData: Record<string, HolidayInfo>): number {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    let workdays = 0;

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        if (isWorkdayWithHoliday(d, holidayData)) {
            workdays++;
        }
    }

    return workdays || 22; // 如果计算失败，回退到默认的22天
}

// 使用时间戳计算今日已赚工资
export function getTodayEarningsWithTimestamp(settings: Settings): number {
    const now = new Date();
    const nowTimestamp = now.getTime();

    if (!isWorkday(now)) {
        return 0;
    }

    const workdayRange = getWorkdayTimestampRange(settings, now);
    if (!workdayRange) {
        return 0;
    }

    // 还没开始工作
    if (nowTimestamp < workdayRange.start) {
        return 0;
    }

    // 已经下班
    if (nowTimestamp >= workdayRange.end) {
        const workdays = getMonthWorkdays(now, currentHolidayData);
        const dailySalary = settings.monthlySalary / workdays;
        return dailySalary; // 返回全天工资
    }

    let workedTime = nowTimestamp - workdayRange.start;

    // 扣除午休时间
    if (nowTimestamp > workdayRange.lunchEnd) {
        workedTime -= (workdayRange.lunchEnd - workdayRange.lunchStart);
    } else if (nowTimestamp > workdayRange.lunchStart) {
        workedTime -= (nowTimestamp - workdayRange.lunchStart);
    }

    // 计算日工作总时间
    const totalWorkTime = workdayRange.end - workdayRange.start - (workdayRange.lunchEnd - workdayRange.lunchStart);
    const workdays = getMonthWorkdays(now, currentHolidayData);
    const dailySalary = settings.monthlySalary / workdays;
    const timeRatio = workedTime / totalWorkTime;

    return dailySalary * Math.max(0, timeRatio);
}

// 计算距离下班时间 
export function getTimeUntilWorkEnd(settings: Settings): number | null {
    const now = new Date();
    const nowTimestamp = now.getTime();

    if (!isWorkday(now)) {
        return null;
    }

    const workdayRange = getWorkdayTimestampRange(settings, now);
    if (!workdayRange) {
        return null;
    }

    if (nowTimestamp >= workdayRange.end) {
        return 0;
    }

    return workdayRange.end - nowTimestamp;
}

// 计算今日工作进度百分比 (0-100)
export function getTodayWorkProgress(settings: Settings): number {
    const now = new Date();
    const nowTimestamp = now.getTime();

    if (!isWorkday(now)) {
        return 0;
    }

    const workdayRange = getWorkdayTimestampRange(settings, now);
    if (!workdayRange) {
        return 0;
    }

    // 还没开始工作
    if (nowTimestamp < workdayRange.start) {
        return 0;
    }

    // 已经下班
    if (nowTimestamp >= workdayRange.end) {
        return 100;
    }

    let workedTime = nowTimestamp - workdayRange.start;

    // 扣除午休时间
    if (nowTimestamp > workdayRange.lunchEnd) {
        workedTime -= (workdayRange.lunchEnd - workdayRange.lunchStart);
    } else if (nowTimestamp > workdayRange.lunchStart) {
        workedTime -= (nowTimestamp - workdayRange.lunchStart);
    }

    // 计算日工作总时间
    const totalWorkTime = workdayRange.end - workdayRange.start - (workdayRange.lunchEnd - workdayRange.lunchStart);
    const timeRatio = workedTime / totalWorkTime;

    return Math.max(0, Math.min(100, timeRatio * 100));
}

// 计算本周已赚工资
export function getWeekEarnings(settings: Settings): number {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // 周一开始
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const nowTimestamp = now.getTime();

    let totalEarnings = 0;
    const workdays = getMonthWorkdays(now, currentHolidayData);
    const dailySalary = settings.monthlySalary / workdays;

    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const dayTimestamp = d.getTime();

        if (dayTimestamp <= nowTimestamp && isWorkday(d)) {
            if (format(d, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
                // 今天，计算实际工作时间
                totalEarnings += getTodayEarningsWithTimestamp(settings);
            } else {
                // 之前的工作日，算全天
                totalEarnings += dailySalary;
            }
        }
    }

    return totalEarnings;
}

// 计算本月已赚工资
export function getMonthEarnings(settings: Settings): number {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const nowTimestamp = now.getTime();

    let totalEarnings = 0;
    const workdays = getMonthWorkdays(now, currentHolidayData);
    const dailySalary = settings.monthlySalary / workdays;

    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dayTimestamp = d.getTime();

        if (dayTimestamp <= nowTimestamp && isWorkday(d)) {
            if (format(d, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
                totalEarnings += getTodayEarningsWithTimestamp(settings);
            } else {
                totalEarnings += dailySalary;
            }
        }
    }

    return totalEarnings;
}

// 计算距离周末时间(周五下班时间)
export function getTimeUntilWeekend(settings: Settings): number {
    const now = new Date();
    const nowTimestamp = now.getTime();
    const currentDay = now.getDay(); // 0=周日, 1=周一, ..., 6=周六

    // 如果已经是周末
    if (currentDay === 0 || currentDay === 6) {
        return 0;
    }

    // 找到本周的周五
    const friday = new Date(now);
    const daysUntilFriday = 5 - currentDay; // 5 = 周五
    friday.setDate(now.getDate() + daysUntilFriday);

    // 如果今天是周五
    if (currentDay === 5) {
        // 如果是工作日且在上班时间内，返回到下班时间
        if (isWorkday(now)) {
            const workdayRange = getWorkdayTimestampRange(settings, now);
            if (workdayRange && nowTimestamp < workdayRange.end) {
                return workdayRange.end - nowTimestamp;
            }
        }
        // 已经下班或不是工作日，周末已经开始
        return 0;
    }

    // 如果是周一到周四
    // 计算到周五下班时间
    const fridayEndTime = new Date(friday);
    const [endHours, endMinutes] = settings.workEndTime.split(':').map(Number);
    fridayEndTime.setHours(endHours, endMinutes, 0, 0);

    return fridayEndTime.getTime() - nowTimestamp;
}

// 计算距离下一个节假日的时间,比如节假日是2号，则计算到1号下班时间
export function getTimeUntilNextHoliday(settings: Settings): { milliseconds: number; holidayName: string } | null {
    if (!isHolidayDataLoaded) {
        return null;
    }

    const now = new Date();
    const nowTimestamp = now.getTime();

    // 如果今天不是工作日（节假日或周末），已经在假期中
    if (!isWorkday(now)) {
        return {
            milliseconds: 0,
            holidayName: "当前假期"
        };
    }

    // 获取下一个节假日
    const nextHoliday = getNextHoliday(currentHolidayData);

    if (!nextHoliday) {
        return null;
    }

    // 找到节假日前一个工作日
    const holidayDate = new Date(nextHoliday.date);
    const lastWorkdayBeforeHoliday = new Date(holidayDate);
    lastWorkdayBeforeHoliday.setDate(holidayDate.getDate() - 1);

    // 向前找到最近的工作日
    while (!isWorkday(lastWorkdayBeforeHoliday)) {
        lastWorkdayBeforeHoliday.setDate(lastWorkdayBeforeHoliday.getDate() - 1);
    }

    // 如果今天就是节假日前的最后一个工作日
    const todayStr = format(now, 'yyyy-MM-dd');
    const lastWorkdayStr = format(lastWorkdayBeforeHoliday, 'yyyy-MM-dd');

    if (todayStr === lastWorkdayStr) {
        // 如果还在上班时间内，返回到下班时间
        const workdayRange = getWorkdayTimestampRange(settings, now);
        if (workdayRange && nowTimestamp < workdayRange.end) {
            return {
                milliseconds: workdayRange.end - nowTimestamp,
                holidayName: nextHoliday.name
            };
        }
        // 已经下班，节假日已经开始
        return {
            milliseconds: 0,
            holidayName: nextHoliday.name
        };
    }

    // 计算到节假日前最后一个工作日的下班时间
    const [endHours, endMinutes] = settings.workEndTime.split(':').map(Number);
    const targetEndTime = new Date(lastWorkdayBeforeHoliday);
    targetEndTime.setHours(endHours, endMinutes, 0, 0);

    return {
        milliseconds: targetEndTime.getTime() - nowTimestamp,
        holidayName: nextHoliday.name
    };
}

// 计算时薪
export function getHourlyRate(settings: Settings): number {
    const now = new Date();
    const workdays = getMonthWorkdays(now, currentHolidayData);

    // 计算每日工作时长（毫秒）
    const workdayRange = getWorkdayTimestampRange(settings, now);
    if (!workdayRange) {
        return 0;
    }

    // 计算总工作时间（减去午休时间）
    const totalWorkTime = workdayRange.end - workdayRange.start - (workdayRange.lunchEnd - workdayRange.lunchStart);
    const dailyWorkHours = totalWorkTime / (1000 * 60 * 60); // 转换为小时

    // 计算时薪
    return settings.monthlySalary / workdays / dailyWorkHours;
}

// 生成所有工资和时间计算结果
export interface TimestampCalculationResults {
    timestamp: number;
    todayEarnings: number;
    weekEarnings: number;
    monthEarnings: number;
    nextPayday: Date;
    timeUntilWorkEnd: number | null;
    timeUntilWeekend: number;
    timeUntilNextHoliday: { milliseconds: number; holidayName: string } | null;
    isWorkday: boolean;
    holidayDataStatus: { loaded: boolean; dataCount: number };
    hourlyRate: number;
}

export function getAllTimestampCalculations(settings: Settings): TimestampCalculationResults {
    const now = new Date();
    return {
        timestamp: now.getTime(),
        todayEarnings: getTodayEarningsWithTimestamp(settings),
        weekEarnings: getWeekEarnings(settings),
        monthEarnings: getMonthEarnings(settings),
        nextPayday: getNextPayday(settings),
        timeUntilWorkEnd: getTimeUntilWorkEnd(settings),
        timeUntilWeekend: getTimeUntilWeekend(settings),
        timeUntilNextHoliday: getTimeUntilNextHoliday(settings),
        isWorkday: isWorkday(now),
        holidayDataStatus: getHolidayDataStatus(),
        hourlyRate: getHourlyRate(settings)
    };
} 