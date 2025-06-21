/**
 * VoiceEngineファクトリ
 * プラットフォームに応じて適切な音声エンジンを生成
 */

const { getPlatform } = require('./platform-detector');

class VoiceEngineFactory {
    static createEngine() {
        const platform = getPlatform();
        
        switch (platform) {
            case 'macos':
                const MacOSVoiceEngine = require('./voice-engines/macos');
                return new MacOSVoiceEngine();
            
            case 'windows':
                const WindowsVoiceEngine = require('./voice-engines/windows');
                return new WindowsVoiceEngine();
            
            case 'linux':
                const LinuxVoiceEngine = require('./voice-engines/linux');
                return new LinuxVoiceEngine();
            
            default:
                throw new Error(`Unsupported platform: ${platform}`);
        }
    }

    static async createAndInitialize() {
        const engine = VoiceEngineFactory.createEngine();
        await engine.initialize();
        return engine;
    }
}

module.exports = VoiceEngineFactory;