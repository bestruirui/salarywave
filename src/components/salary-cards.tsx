"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, Calendar } from "lucide-react"
import { Settings } from "@/lib/storage"
import { getTodayEarningsWithTimestamp, getWeekEarnings, getMonthEarnings, getHourlyRate, getTodayWorkProgress } from "@/lib/calculations"
import { AnimatedNumber } from "./animated-number"
import { CircularProgress } from "@/components/ui/circular-progress"

interface SalaryCardsProps {
    settings: Settings
}

export function SalaryCards({ settings }: SalaryCardsProps) {
    const [refreshTick, setRefreshTick] = useState(0)
    const [todayEarnings, setTodayEarnings] = useState(0)
    const [weekEarnings, setWeekEarnings] = useState(0)
    const [monthEarnings, setMonthEarnings] = useState(0)
    const [hourlyRate, setHourlyRate] = useState(0)
    const [todayProgress, setTodayProgress] = useState(0)

    // 设置刷新定时器
    useEffect(() => {
        const refreshIntervalMs = 500 // 更频繁地刷新以实现平滑过渡

        const timer = setInterval(() => {
            setRefreshTick(prev => prev + 1)
        }, refreshIntervalMs)

        return () => clearInterval(timer)
    }, [])

    // 响应refreshTick和settings变化，重新计算数据
    useEffect(() => {
        setTodayEarnings(getTodayEarningsWithTimestamp(settings))
        setWeekEarnings(getWeekEarnings(settings))
        setMonthEarnings(getMonthEarnings(settings))
        setHourlyRate(getHourlyRate(settings))
        setTodayProgress(getTodayWorkProgress(settings))
    }, [refreshTick, settings])

    const formatCurrency = (amount: number, precision: number = 0) => {
        return new Intl.NumberFormat('zh-CN', {
            style: 'currency',
            currency: 'CNY',
            minimumFractionDigits: precision,
            maximumFractionDigits: precision,
        }).format(amount)
    }

    // 创建一个格式化函数传递给AnimatedNumber
    const currencyFormatter = (precision: number) => (value: number) => {
        return formatCurrency(value, precision)
    }

    // 计算本周工作进度 (简化版本，基于工作日计算)
    const getWeekProgress = () => {
        const now = new Date()
        const dayOfWeek = now.getDay() // 0=周日, 1=周一, ..., 6=周六
        if (dayOfWeek === 0 || dayOfWeek === 6) return 100 // 周末

        // 周一到周五，加上今日进度
        const completedDays = dayOfWeek - 1 // 已完成的工作日
        const todayProgressRatio = todayProgress / 100
        const totalProgress = (completedDays + todayProgressRatio) / 5 * 100
        return Math.min(100, totalProgress)
    }

    // 计算本月工作进度 (简化版本)
    const getMonthProgress = () => {
        const now = new Date()
        const currentDate = now.getDate()
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        return Math.min(100, (currentDate / daysInMonth) * 100)
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">今日已赚</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-24 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4 flex items-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 transition-all duration-500 ease-out leading-tight">
                                <AnimatedNumber
                                    value={todayEarnings}
                                    precision={5}
                                    duration={450}
                                    formatter={currencyFormatter(5)}
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0 mr-2">
                            <CircularProgress
                                value={todayProgress}
                                size={70}
                                strokeWidth={9}
                                color="text-green-600 dark:text-green-400"
                                className="opacity-90"
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-6 right-6">
                        <Badge variant="secondary">
                            时薪：<AnimatedNumber
                                value={hourlyRate}
                                duration={450}
                                formatter={currencyFormatter(2)}
                            />/小时
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">本周已赚</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-24 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4 flex items-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-500 ease-out leading-tight">
                                <AnimatedNumber
                                    value={Math.round(weekEarnings)}
                                    duration={450}
                                    formatter={currencyFormatter(0)}
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0 mr-2">
                            <CircularProgress
                                value={getWeekProgress()}
                                size={70}
                                strokeWidth={9}
                                color="text-blue-600 dark:text-blue-400"
                                className="opacity-90"
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-6 right-6">
                        <Badge variant="secondary">
                            智能计算工作日
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">本月已赚</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="relative pb-10 h-24 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 pr-4 flex items-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-500 ease-out leading-tight">
                                <AnimatedNumber
                                    value={Math.round(monthEarnings)}
                                    duration={450}
                                    formatter={currencyFormatter(0)}
                                />
                            </div>
                        </div>
                        <div className="flex-shrink-0 mr-2">
                            <CircularProgress
                                value={getMonthProgress()}
                                size={70}
                                strokeWidth={9}
                                color="text-purple-600 dark:text-purple-400"
                                className="opacity-90"
                            />
                        </div>
                    </div>
                    <div className="absolute bottom-0 left-6 right-6">
                        <Badge variant="secondary">
                            考虑节假日
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
} 