//Added Settings
export interface ISettings {
    musicVolume: number;   // 0.0 - 1.0
    sfxVolume: number;     // 0.0 - 1.0
    voicesVolume: number;  // 0.0 - 1.0
    musicEnabled: boolean;
    sfxEnabled: boolean;
    voicesEnabled: boolean;
}

export class Settings implements ISettings {
    musicVolume = 1.0;
    sfxVolume = 1.0;
    voicesVolume = 1.0;
    musicEnabled = true;
    sfxEnabled = true;
    voicesEnabled = true;

    setMusicVolume(vol: number) {
        this.musicVolume = Math.max(0, Math.min(1, vol));
    }
    setSfxVolume(vol: number) {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
    }
    setVoicesVolume(vol: number) {
        this.voicesVolume = Math.max(0, Math.min(1, vol));
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
    }
    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
    }
    toggleVoices() {
        this.voicesEnabled = !this.voicesEnabled;
    }
}
