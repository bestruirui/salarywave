"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CircularProgressProps {
    value: number // 0-100 的进度值
    size?: number // 圆形的大小
    strokeWidth?: number // 线条宽度
    className?: string
    showText?: boolean // 是否显示百分比文字
    color?: string // 进度条颜色
}

export function CircularProgress({
    value,
    size = 56,
    strokeWidth = 5,
    className,
    showText = true,
    color = "text-primary"
}: CircularProgressProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDasharray = `${circumference} ${circumference}`
    const strokeDashoffset = circumference - (value / 100) * circumference

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size + 8, height: size + 8, padding: '4px' }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90 drop-shadow-sm"
                style={{ overflow: 'visible' }}
            >
                {/* 背景圆环 */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    className="text-muted-foreground/15"
                />
                {/* 进度圆环 */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={cn("transition-all duration-700 ease-out", color)}
                    style={{
                        filter: "drop-shadow(0 0 1px currentColor)"
                    }}
                />
            </svg>
            {/* 中心文字 */}
            {showText && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-sm font-semibold tabular-nums", color)}>
                        {Math.round(value)}%
                    </span>
                </div>
            )}
        </div>
    )
} 