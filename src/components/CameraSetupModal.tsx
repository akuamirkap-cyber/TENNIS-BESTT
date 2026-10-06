import React from 'react';
import { useEditorStore } from '../store';

export function CameraSetupModal({ 
    isOpen, 
    onClose, 
    camConfig, 
    setCamConfig, 
    gameMode 
}: { 
    isOpen: boolean, 
    onClose: () => void, 
    camConfig: any, 
    setCamConfig: React.Dispatch<React.SetStateAction<any>>,
    gameMode: string
}) {
    if (!isOpen) return null;

    const prefix = gameMode === 'tennis' ? 'tennisGta' : 'stumbleGta';

    const updateConfig = (key: string, value: number) => {
        setCamConfig((prev: any) => ({ ...prev, [prefix + key]: value }));
    };

    const getValue = (key: string) => camConfig[prefix + key] || 0;

    return (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-black/80 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-2xl text-white w-80">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Camera Setup</h2>
                <button onClick={onClose} className="text-white/60 hover:text-white font-bold">✕</button>
            </div>
            
            <div className="flex flex-col gap-4">
                <div>
                    <label className="flex justify-between text-sm font-bold mb-1">
                        <span>Zoom / Distance</span>
                        <span className="text-blue-400">{getValue('TargetZ').toFixed(1)}</span>
                    </label>
                    <input type="range" min="1" max="20" step="0.1" value={getValue('TargetZ')} onChange={e => updateConfig('TargetZ', parseFloat(e.target.value))} className="w-full accent-blue-500" />
                </div>
                
                <div>
                    <label className="flex justify-between text-sm font-bold mb-1">
                        <span>Height (Y)</span>
                        <span className="text-green-400">{getValue('TargetY').toFixed(1)}</span>
                    </label>
                    <input type="range" min="0" max="15" step="0.1" value={getValue('TargetY')} onChange={e => updateConfig('TargetY', parseFloat(e.target.value))} className="w-full accent-green-500" />
                </div>

                <div>
                    <label className="flex justify-between text-sm font-bold mb-1">
                        <span>Look Angle (Pitch)</span>
                        <span className="text-purple-400">{getValue('LookY').toFixed(1)}</span>
                    </label>
                    <input type="range" min="-5" max="5" step="0.1" value={getValue('LookY')} onChange={e => updateConfig('LookY', parseFloat(e.target.value))} className="w-full accent-purple-500" />
                </div>
                
                <div>
                    <label className="flex justify-between text-sm font-bold mb-1">
                        <span>Look Distance (Depth)</span>
                        <span className="text-orange-400">{getValue('LookZ').toFixed(1)}</span>
                    </label>
                    <input type="range" min="-20" max="10" step="0.1" value={getValue('LookZ')} onChange={e => updateConfig('LookZ', parseFloat(e.target.value))} className="w-full accent-orange-500" />
                </div>
                
                <div className="mt-2 pt-4 border-t border-white/20">
                    <label className="flex justify-between text-sm font-bold mb-1 text-white/80">
                        <span>Field of View (FOV)</span>
                        <span>{camConfig.fov || 45}°</span>
                    </label>
                    <input type="range" min="20" max="100" step="1" value={camConfig.fov || 45} onChange={e => setCamConfig((p: any) => ({...p, fov: parseFloat(e.target.value)}))} className="w-full" />
                </div>
            </div>
        </div>
    );
}
