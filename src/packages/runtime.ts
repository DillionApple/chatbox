import * as api from '@tauri-apps/api'
import { Store } from 'tauri-plugin-store-api'

const store = new Store('config.json')

setInterval(
    async () => {
        try {
            await store.save()
        } catch (e) {
            console.log(e)
        }
    },
    5 * 60 * 1000,
)

export const writeStore = async (key: string, value: any) => {
    window.localStorage.setItem(key, JSON.stringify(value))
}

export const readStore = async (key: string): Promise<any | undefined> => {
    const value_str = window.localStorage.getItem(key)
    if (value_str) {
        return JSON.parse(value_str)
    }
    return undefined
}

async function handleCompatibilityV0_1() {
    // 第一次启动时，将旧版本的配置文件迁移到新的配置文件中
    try {
        const handled = await store.get('hasHandleCompatibilityV0_1')
        if (!handled) {
            const oldConfigJson = await api.fs.readTextFile('chatbox/config.json', { dir: api.fs.Dir.LocalData })
            const oldConfig = JSON.parse(oldConfigJson)
            for (const key in oldConfig) {
                await store.set(key, oldConfig[key])
            }
            await store.set('hasHandleCompatibilityV0_1', true)
            await store.save()
        }
    } catch (e) {
        console.log(e)
    }
}

export const shouldUseDarkColors = async (): Promise<boolean> => {
    const theme = await api.window.appWindow.theme()
    return theme === 'dark'
}

export async function onSystemThemeChange(callback: () => void) {
    return api.window.appWindow.onThemeChanged(callback)
}

export const getVersion = async () => {
    return api.app.getVersion()
}

export const openLink = async (url: string) => {
    return api.shell.open(url)
}

export const getPlatform = async () => {
    return api.os.platform()
}
