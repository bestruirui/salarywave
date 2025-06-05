"use client"

import { useEffect, useState, useRef } from "react"

interface AnimatedNumberProps {
    value: number
    precision?: number
    duration?: number
    className?: string
    formatter?: (value: number) => string
}

export function AnimatedNumber({
    value,
    precision = 0,
    duration = 500,
    className = "",
    formatter
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value)
    const previousValue = useRef(value)
    const startTimeRef = useRef<number | null>(null)
    const frameRef = useRef<number | null>(null)
    const animationInProgressRef = useRef(false)

    useEffect(() => {
        // 如果值没有变化，则不进行动画
        if (previousValue.current === value) return

        const startValue = animationInProgressRef.current ? displayValue : previousValue.current
        const endValue = value
        startTimeRef.current = performance.now()
        animationInProgressRef.current = true

        // 取消之前的动画帧
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current)
        }

        const animateValue = (timestamp: number) => {
            // 如果没有开始时间，使用当前时间戳
            if (startTimeRef.current === null) {
                startTimeRef.current = timestamp
            }

            // 计算动画进度 (0 到 1)
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

            // 使用匀速函数
            const easedProgress = progress

            // 计算当前值
            const currentValue = startValue + (endValue - startValue) * easedProgress

            // 更新显示值
            setDisplayValue(currentValue)

            // 如果动画未完成，继续请求下一帧
            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animateValue)
            } else {
                // 动画完成，更新当前值为目标值
                setDisplayValue(endValue)
                previousValue.current = endValue
                frameRef.current = null
                startTimeRef.current = null
                animationInProgressRef.current = false
            }
        }

        // 启动动画
        frameRef.current = requestAnimationFrame(animateValue)

        // 清理函数
        return () => {
            if (frameRef.current !== null) {
                cancelAnimationFrame(frameRef.current)
                frameRef.current = null
            }
        }
    }, [value, duration, displayValue])

    // 格式化输出
    const formattedValue = formatter
        ? formatter(displayValue)
        : displayValue.toFixed(precision)

    return <span className={className}>{formattedValue}</span>
} 