"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { SalaryCards } from "@/components/salary-cards"
import { CountdownCards } from "@/components/countdown-cards"
import { SettingsDialog } from "@/components/settings-dialog"
import { Settings, getSettings } from "@/lib/storage"
import { initializeHolidayData, getHolidayDataStatus } from "@/lib/calculations"

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [holidayDataStatus, setHolidayDataStatus] = useState({ loaded: false, dataCount: 0 })
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // 初始化应用
    const initializeApp = async () => {
      // 初始化设置
      setSettings(getSettings())

      // 初始化节假日数据
      await initializeHolidayData()
      setHolidayDataStatus(getHolidayDataStatus())
      setIsInitializing(false)
    }

    initializeApp()

    // 仅为显示当前时间的定时器，每秒更新
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // 重新初始化节假日数据
      await initializeHolidayData()
      setHolidayDataStatus(getHolidayDataStatus())
      setCurrentTime(new Date())
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings)
  }

  if (!settings || isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="text-lg text-muted-foreground">
            {isInitializing ? "正在加载节假日数据..." : "初始化中..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              薪动
            </h1>
            <div className="flex items-center space-x-2">
              <Badge variant={holidayDataStatus.loaded ? "default" : "destructive"} className="text-xs">
                {holidayDataStatus.loaded ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    节假日数据已加载 ({holidayDataStatus.dataCount})
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    节假日数据加载失败
                  </>
                )}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">刷新</span>
            </Button>
            <SettingsDialog
              settings={settings}
              onSettingsChange={handleSettingsChange}
            />
            <ThemeToggle />
          </div>
        </header>

        {/* Current Time */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-mono text-gray-900 dark:text-gray-100">
            {format(currentTime, "yyyy年MM月dd日 HH:mm:ss", { locale: zhCN })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {format(currentTime, "EEEE", { locale: zhCN })}
          </div>
        </div>

        {/* Salary Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            💰 工资收入
          </h2>
          <SalaryCards settings={settings} />
        </div>

        <Separator className="my-8" />

        {/* Countdown Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            ⏰ 倒计时
          </h2>
          <CountdownCards settings={settings} />
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground mt-16">
          <p>© 2024 薪动 - 让每一分钟的工作都有意义</p>
          {holidayDataStatus.loaded && (
            <p className="mt-1">节假日数据来源：timor.tech API (2025年)</p>
          )}
        </footer>
      </div>
    </div>
  )
}
