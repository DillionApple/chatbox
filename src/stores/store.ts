import { useState, useEffect, useRef } from 'react'
import { Settings, createSession, Session, Message, Config, UsageData } from './types'
import * as defaults from '../packages/defaults'
import { v4 as uuidv4 } from 'uuid'
import { ThemeMode } from '../theme'
import * as runtime from '../packages/runtime'
import * as remote from '../packages/remote'
import { useTranslation } from 'react-i18next'

// setting store

export function getDefaultSettings(): Settings {
    return {
        openaiKey: '',
        apiHost: 'https://api-openai-us1.deepseek.com:8443',
        model: 'gpt-35-turbo',
        temperature: 0.7,
        maxContextSize: '4000',
        maxTokens: '2048',
        showWordCount: false,
        showTokenCount: false,
        showModelName: false,
        theme: ThemeMode.System,
        language: 'en',
        fontSize: 13,
    }
}

export async function readSettings(): Promise<Settings> {
    const setting: Settings | undefined = await runtime.readStore('settings')
    if (!setting) {
        return getDefaultSettings()
    }
    // 兼容早期版本
    const settingWithDefaults = Object.assign({}, getDefaultSettings(), setting)

    return settingWithDefaults
}

export async function writeSettings(settings: Settings) {
    if (!settings.apiHost) {
        settings.apiHost = getDefaultSettings().apiHost
    }
    return runtime.writeStore('settings', settings)
}

export async function readConfig(): Promise<Config> {
    let config: Config | undefined = await runtime.readStore('configs')
    if (!config) {
        config = { uuid: uuidv4() }
        await runtime.writeStore('configs', config)
    }
    return config
}

export async function writeConfig(config: Config) {
    return runtime.writeStore('configs', config)
}

export async function getUsageData(apiHost: string, user_sk: string): Promise<UsageData> {
    const remote_url = `${apiHost}/usage/?user_sk=${user_sk}`
    const response = await fetch(remote_url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    const date_list: string[] = []
    const usage_list: number[] = []
    let ret: UsageData

    let json_data
    try {
        json_data = await response.json()
    } catch (error) {
        console.error("Error while getting usage data: ", error)
        ret = {
            date_list,
            usage_list,
            quota: {
                type: "null",
                value: 0,
                expire_date: '19700101',
            },
            usage: 0,
            user_name: "null",
            user_sk: "null"
        }
        return ret
    }

    for (let i = 0; i < json_data.usage_daily.length; ++i) {
        date_list.push(json_data.usage_daily[i][0])
        usage_list.push(json_data.usage_daily[i][1])
    }
    ret = {
        date_list,
        usage_list,
        quota: json_data.quota,
        usage: json_data.usage,
        user_name: json_data.user_name,
        user_sk: user_sk,
    }
    return ret
}

// session store

export async function readSessions(settings: Settings): Promise<Session[]> {
    const sessions: Session[] | undefined = await runtime.readStore('chat-sessions')
    if (!sessions) {
        return defaults.sessions
    }
    if (sessions.length === 0) {
        return [createSession()]
    }
    return sessions.map((s: any) => {
        // 兼容旧版本的数据
        if (!s.model) {
            s.model = getDefaultSettings().model
        }
        return s
    })
}

export async function writeSessions(sessions: Session[]) {
    return runtime.writeStore('chat-sessions', sessions)
}

// react hook

export default function useStore() {
    const { i18n } = useTranslation()

    const [version, _setVersion] = useState('1.0')
    const [needCheckUpdate, setNeedCheckUpdate] = useState(false)
    const updateCheckTimer = useRef<NodeJS.Timeout>()

    const [settings, _setSettings] = useState<Settings>(getDefaultSettings())
    const [needSetting, setNeedSetting] = useState(false)
    useEffect(() => {
        readSettings().then((settings) => {
            _setSettings(settings)
            if (settings.openaiKey === '') {
                setNeedSetting(true)
            }
            i18n.changeLanguage(settings.language).then()
        })
    }, [])
    const setSettings = (settings: Settings) => {
        _setSettings(settings)
        writeSettings(settings)
        i18n.changeLanguage(settings.language).then()
    }

    const [chatSessions, _setChatSessions] = useState<Session[]>([createSession()])
    const [currentSession, switchCurrentSession] = useState<Session>(chatSessions[0])
    useEffect(() => {
        readSessions(settings).then((sessions: Session[]) => {
            _setChatSessions(sessions)
            switchCurrentSession(sessions[0])
        })
    }, [])
    const setSessions = (sessions: Session[]) => {
        _setChatSessions(sessions)
        writeSessions(sessions)
    }

    const deleteChatSession = (target: Session) => {
        const sessions = chatSessions.filter((s) => s.id !== target.id)
        if (sessions.length === 0) {
            sessions.push(createSession())
        }
        if (target.id === currentSession.id) {
            switchCurrentSession(sessions[0])
        }
        setSessions(sessions)
    }
    const updateChatSession = (session: Session) => {
        const sessions = chatSessions.map((s) => {
            if (s.id === session.id) {
                return session
            }
            return s
        })
        setSessions(sessions)
        if (session.id === currentSession.id) {
            switchCurrentSession(session)
        }
    }
    const createChatSession = (session: Session, ix?: number) => {
        const sessions = [...chatSessions, session]
        setSessions(sessions)
        switchCurrentSession(session)
    }
    const createEmptyChatSession = () => {
        createChatSession(createSession())
    }

    const setMessages = (session: Session, messages: Message[]) => {
        updateChatSession({
            ...session,
            messages,
        })
    }

    const [toasts, _setToasts] = useState<{ id: string; content: string }[]>([])
    const addToast = (content: string) => {
        const id = uuidv4()
        _setToasts([...toasts, { id, content }])
    }
    const removeToast = (id: string) => {
        _setToasts(toasts.filter((t) => t.id !== id))
    }

    return {
        version,
        needCheckUpdate,

        settings,
        setSettings,
        needSetting,

        getUsageData,

        chatSessions,
        createChatSession,
        updateChatSession,
        deleteChatSession,
        createEmptyChatSession,

        setSessions,
        currentSession,
        switchCurrentSession,

        toasts,
        addToast,
        removeToast,
    }
}
