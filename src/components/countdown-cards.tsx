"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Home, Calendar, PartyPopper } from "lucide-react"
import { Settings } from "@/lib/storage"
import {
    getNextPayday,
    getTimeUntilWorkEnd,
    getTimeUntilWeekend,
    getTimeUntilNextHoliday,
    formatCountdown,
} from "@/lib/calculations"
import { differenceInMilliseconds } from "date-fns"
import { useEffect, useState } from "react"

interface CountdownCardsProps {
    settings: Settings
}

export function CountdownCards({ settings }: CountdownCardsProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000) // 每秒更新一次

        return () => clearInterval(timer)
    }, [])

    const nextPayday = getNextPayday(settings)
    const paydayCountdownMilliseconds = differenceInMilliseconds(nextPayday, currentTime)

    const workEnd = getTimeUntilWorkEnd(settings)
    const weekend = getTimeUntilWeekend(settings)
    const holidayInfo = getTimeUntilNextHoliday(settings)

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">发薪日倒计时</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-20">
                    <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-tight">
                        {formatCountdown(paydayCountdownMilliseconds)}
                    </div>
                    <Badge variant="secondary" className="absolute bottom-0 left-6 right-6">
                        每月{settings.payDay}号发薪
                    </Badge>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">下班倒计时</CardTitle>
                    <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-20">
                    <div className="text-lg font-bold text-red-600 dark:text-red-400 leading-tight">
                        {workEnd !== null ? formatCountdown(workEnd) : '今天不上班'}
                    </div>
                    <Badge variant="secondary" className="absolute bottom-0 left-6 right-6">
                        {settings.workEndTime} 下班
                    </Badge>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">周末倒计时</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-20">
                    <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 leading-tight">
                        {formatCountdown(weekend, "🎉 周末愉快！")}
                    </div>
                    <Badge variant="secondary" className="absolute bottom-0 left-6 right-6">
                        {(() => {
                            const now = new Date();
                            const currentDay = now.getDay();

                            if (currentDay === 0 || currentDay === 6) {
                                return '已到周末';
                            } else {
                                return '距离周末';
                            }
                        })()}
                    </Badge>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">节假日倒计时</CardTitle>
                    <PartyPopper className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-20">
                    <div className="text-lg font-bold text-pink-600 dark:text-pink-400 leading-tight">
                        {holidayInfo ? formatCountdown(
                            holidayInfo.milliseconds,
                            holidayInfo.holidayName === "当前假期" ? "🎊 假期快乐！" : undefined
                        ) : '暂无节假日'}
                    </div>
                    <Badge variant="secondary" className="absolute bottom-0 left-6 right-6">
                        {(() => {
                            if (!holidayInfo) return '敬请期待';
                            if (holidayInfo.holidayName === "当前假期") {
                                return '已在假期';
                            } else if (holidayInfo.holidayName === "下班时间") {
                                return '距离放假';
                            } else {
                                return holidayInfo.holidayName;
                            }
                        })()}
                    </Badge>
                </CardContent>
            </Card>
        </div>
    )
} 