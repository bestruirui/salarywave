"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Settings as SettingsIcon } from "lucide-react"
import { Settings, saveSettings } from "@/lib/storage"
import { toast } from "sonner"

interface SettingsDialogProps {
    settings: Settings
    onSettingsChange: (settings: Settings) => void
}

export function SettingsDialog({ settings, onSettingsChange }: SettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState<Settings>(settings)

    const handleSave = () => {
        saveSettings(formData)
        onSettingsChange(formData)
        setOpen(false)
        toast.success("设置已保存", {
            description: "您的工资追踪设置已成功更新！",
        })
    }

    const handleInputChange = (field: keyof Settings, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <SettingsIcon className="h-4 w-4" />
                    <span className="sr-only">设置</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>工资追踪设置</DialogTitle>
                    <DialogDescription>
                        配置您的工作信息以获得准确的工资计算结果
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="monthlySalary">月薪 (元)</Label>
                        <Input
                            id="monthlySalary"
                            type="number"
                            value={formData.monthlySalary}
                            onChange={(e) => handleInputChange('monthlySalary', Number(e.target.value))}
                            placeholder="请输入月薪"
                        />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="workStartTime">上班时间</Label>
                            <Input
                                id="workStartTime"
                                type="time"
                                value={formData.workStartTime}
                                onChange={(e) => handleInputChange('workStartTime', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="workEndTime">下班时间</Label>
                            <Input
                                id="workEndTime"
                                type="time"
                                value={formData.workEndTime}
                                onChange={(e) => handleInputChange('workEndTime', e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="lunchBreakStart">午休开始</Label>
                            <Input
                                id="lunchBreakStart"
                                type="time"
                                value={formData.lunchBreakStart}
                                onChange={(e) => handleInputChange('lunchBreakStart', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lunchBreakEnd">午休结束</Label>
                            <Input
                                id="lunchBreakEnd"
                                type="time"
                                value={formData.lunchBreakEnd}
                                onChange={(e) => handleInputChange('lunchBreakEnd', e.target.value)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                        <Label htmlFor="payDay">发薪日 (每月几号)</Label>
                        <Input
                            id="payDay"
                            type="number"
                            min="1"
                            max="31"
                            value={formData.payDay}
                            onChange={(e) => handleInputChange('payDay', Number(e.target.value))}
                            placeholder="请输入发薪日期"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSave}>
                        保存设置
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
} 