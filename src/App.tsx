import {useRef, useState} from 'react'
import './App.css'
import {ConfigProvider, FloatButton, theme} from "antd";
import {
    FastBackwardOutlined, FastForwardOutlined,
    FileSyncOutlined,
    PauseCircleOutlined, PlayCircleOutlined,
    StepBackwardOutlined, StepForwardOutlined
} from "@ant-design/icons";
import Onboard from "./Onboard.tsx";
import Session, {Action, DisplayAction, PlayAction, TimeAction, WaitAction} from "./Session.ts";

function App() {
    const [session, setSession] = useState<Session>();
    const [currentAction, setCurrentAction] = useState<Action | null>(null);
    const [activeTimeAction, setActiveTimeAction] = useState<TimeAction | null>(null);
    const [progress, setProgress] = useState(0);
    const [, setIsPaused] = useState(false);
    const isPlayingRef = useRef(false);
    const isPausedRef = useRef(false);
    
    const handlePause = () => {
        setIsPaused(true);
        isPausedRef.current = true;
    }

    const handleResume = () => {
        if (!isPlayingRef.current) {
            handleGo();
        } else {
            setIsPaused(false);
            isPausedRef.current = false;
        }
    }
    
    const wait = (seconds: number) => {
        return new Promise<void>(resolve => {
            let remaining = seconds * 1000;
            const start = Date.now();
            
            const check = () => {
                if (!isPlayingRef.current) {
                    resolve();
                    return;
                }
                
                if (!isPausedRef.current) {
                    remaining -= (Date.now() - lastCheck);
                }
                lastCheck = Date.now();

                if (remaining <= 0) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };

            let lastCheck = start;
            setTimeout(check, 100);
        });
    }

    const handleGo = async () => {
        if (isPlayingRef.current) return;
        isPlayingRef.current = true;

        console.log("Playing sequence:", session?.sequence)
        for(const action of session?.sequence ?? []){
            console.log("Action type:", action.type)
            
            if (action instanceof TimeAction) {
                console.log("Time action (background):", action.duration, action.color)
                setActiveTimeAction(action);
                setProgress(0);
                const durationMs = action.duration * 1000;
                let elapsedMs = 0;
                let lastTimestamp = Date.now();
                
                // Fire and forget (background animation)
                const animate = () => {
                    if (!isPlayingRef.current || activeTimeAction !== action) {
                         // Optimization: stop if session ended or new TimeAction started
                         // But activeTimeAction check is tricky because it might be the same action object if sequence repeats
                    }

                    const now = Date.now();
                    const deltaTime = now - lastTimestamp;
                    lastTimestamp = now;

                    if (!isPausedRef.current) {
                        elapsedMs += deltaTime;
                        const newProgress = Math.min(100, (elapsedMs / durationMs) * 100);
                        setProgress(newProgress);
                        if (newProgress < 100) {
                            requestAnimationFrame(animate);
                        }
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
                // DO NOT AWAIT - continue to next action
            } else {
                setCurrentAction(action);
                if (action instanceof PlayAction) {
                    console.log("Playing sound:", action.sound)
                    if(action.sound){
                        console.log("Playing!")
                        const audio = new Audio(action.sound);
                        audio.play();
                    }
                } else if (action instanceof WaitAction) {
                    console.log("Waiting:", action.duration)
                    await wait(action.duration);
                    console.log("Wait complete")
                } else if (action instanceof DisplayAction) {
                    // Display stays until next action or end
                }
            }
        }
        isPlayingRef.current = false;
        setIsPaused(false);
        isPausedRef.current = false;
        setCurrentAction(null);
        setActiveTimeAction(null);
        setProgress(0);
    }

    return <ConfigProvider
        theme={{
            algorithm: theme.darkAlgorithm
        }}
    ><div className="app-container">
        {activeTimeAction && (
            <div 
                className="progress-bar" 
                style={{ 
                    width: `${progress}%`, 
                    backgroundColor: activeTimeAction.color 
                }} 
            />
        )}
        {activeTimeAction && activeTimeAction.text && (
            <div className="display-text">{activeTimeAction.text}</div>
        )}
        {currentAction instanceof DisplayAction && (
            <div className="display-text" style={{ color: currentAction.color }}>
                {currentAction.text}
            </div>
        )}
        {
        session ? <>
            <FloatButton.Group shape="square" style={{ insetInlineEnd: 50 }} placement="right">
                <FloatButton icon={<StepBackwardOutlined />} tooltip="Back" />
                <FloatButton icon={<FastBackwardOutlined />} tooltip="Rewind" />
                <FloatButton icon={<PauseCircleOutlined />} onClick={handlePause} tooltip="Pause" />
                <FloatButton icon={<PlayCircleOutlined />} onClick={handleResume} tooltip="Resume" />
                <FloatButton icon={<FastForwardOutlined />} tooltip="" />
                <FloatButton icon={<StepForwardOutlined />} tooltip="" />
                <FloatButton icon={<FileSyncOutlined />} tooltip="" />
            </FloatButton.Group>
        </>: <Onboard setSession={setSession} />
    }</div></ConfigProvider>
}

export default App
