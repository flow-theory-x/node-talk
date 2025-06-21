/**
 * Linux用音声エンジン実装
 * espeak-ng, espeak, festival, speech-dispatcher に対応
 */

const { promisify } = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const VoiceEngine = require('./base');
const { isCommandAvailable, detectLinuxDistribution } = require('../platform-detector');

const execAsync = promisify(exec);

class LinuxVoiceEngine extends VoiceEngine {
    constructor() {
        super();
        this.platform = 'linux';
        this.activeEngine = null;
        this.supportedEngines = [
            { 
                command: 'espeak-ng', 
                package: 'espeak-ng', 
                priority: 1,
                description: '軽量で多言語対応。日本語も利用可能',
                testArgs: '--voices'
            },
            { 
                command: 'espeak', 
                package: 'espeak', 
                priority: 2,
                description: 'espeak-ngの旧版。安定している',
                testArgs: '--voices'
            },
            { 
                command: 'festival', 
                package: 'festival', 
                priority: 3,
                description: '高品質な音声合成。英語が得意',
                testArgs: '--help'
            },
            { 
                command: 'spd-say', 
                package: 'speech-dispatcher', 
                priority: 4,
                description: 'アクセシビリティ向け統合音声システム',
                testArgs: '--help'
            }
        ];
    }

    async initialize() {
        if (this.isInitialized) return;
        
        await this.detectAvailableEngine();
        
        if (!this.activeEngine) {
            this.showInstallInstructions();
            throw new Error('No speech synthesis engine found. Please install one of the supported engines.');
        }
        
        this.availableVoices = await this.getAvailableVoices();
        this.isInitialized = true;
    }

    async detectAvailableEngine() {
        for (const engine of this.supportedEngines) {
            if (isCommandAvailable(engine.command)) {
                try {
                    // エンジンが実際に動作するかテスト
                    await execAsync(`${engine.command} ${engine.testArgs}`, { timeout: 5000 });
                    this.activeEngine = engine;
                    console.log(`音声エンジン ${engine.command} を使用します`);
                    return;
                } catch (error) {
                    console.warn(`${engine.command} is installed but not working: ${error.message}`);
                }
            }
        }
        this.activeEngine = null;
    }

    async checkAvailability() {
        await this.detectAvailableEngine();
        return this.activeEngine !== null;
    }

    async speak(text, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.activeEngine) {
            throw new Error('No speech engine available');
        }

        const { voice, rate } = options;
        
        try {
            let command;
            const isTextJapanese = this.isJapanese(text);
            
            switch (this.activeEngine.command) {
                case 'espeak-ng':
                case 'espeak':
                    command = await this.buildEspeakCommand(text, voice, rate, isTextJapanese);
                    break;
                case 'festival':
                    command = await this.buildFestivalCommand(text, voice, rate, isTextJapanese);
                    break;
                case 'spd-say':
                    command = await this.buildSpdCommand(text, voice, rate, isTextJapanese);
                    break;
                default:
                    throw new Error(`Unsupported engine: ${this.activeEngine.command}`);
            }
            
            await execAsync(command);
            return true;
        } catch (error) {
            throw new Error(this.formatError(error));
        }
    }

    async buildEspeakCommand(text, voice, rate, isJapanese) {
        let selectedVoice;
        if (voice) {
            selectedVoice = voice;
        } else {
            selectedVoice = isJapanese ? this.getDefaultJapaneseVoice() : this.getDefaultEnglishVoice();
        }
        
        let command = `${this.activeEngine.command} -v ${selectedVoice}`;
        
        if (rate) {
            // espeak の速度は words per minute
            command += ` -s ${rate}`;
        }
        
        command += ` "${text.replace(/"/g, '\\"')}"`;
        return command;
    }

    async buildFestivalCommand(text, voice, rate, isJapanese) {
        // festival は主に英語対応
        if (isJapanese) {
            console.warn('警告: festival は日本語サポートが限定的です');
        }
        
        // festival はテキストファイル経由で実行することが多い
        return `echo "${text.replace(/"/g, '\\"')}" | festival --tts`;
    }

    async buildSpdCommand(text, voice, rate, isJapanese) {
        let command = `spd-say`;
        
        if (voice) {
            command += ` -o ${voice}`;
        }
        
        if (rate) {
            // speech-dispatcher の速度は -100 から 100
            const spdRate = Math.max(-100, Math.min(100, Math.round((rate - 200) / 2)));
            command += ` -r ${spdRate}`;
        }
        
        command += ` "${text.replace(/"/g, '\\"')}"`;
        return command;
    }

    async getAvailableVoices() {
        if (!this.activeEngine) {
            return [];
        }

        try {
            switch (this.activeEngine.command) {
                case 'espeak-ng':
                case 'espeak':
                    return await this.getEspeakVoices();
                case 'festival':
                    return await this.getFestivalVoices();
                case 'spd-say':
                    return await this.getSpdVoices();
                default:
                    return [];
            }
        } catch (error) {
            console.warn(`警告: 音声リストの取得に失敗しました: ${error.message}`);
            return [];
        }
    }

    async getEspeakVoices() {
        const { stdout } = await execAsync(`${this.activeEngine.command} --voices`);
        const voices = stdout.split('\n')
            .filter(line => line.trim() && !line.startsWith('Pty'))
            .map(line => {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 4) {
                    return {
                        name: parts[4] || parts[1],
                        lang: parts[1],
                        gender: parts[2],
                        description: parts.slice(4).join(' '),
                        platform: 'linux',
                        engine: this.activeEngine.command
                    };
                }
                return null;
            })
            .filter(voice => voice !== null);
        
        return voices;
    }

    async getFestivalVoices() {
        // festival の音声リストは複雑なので基本的なもののみ
        return [
            { name: 'default', lang: 'en', description: 'Default English voice', platform: 'linux', engine: 'festival' },
            { name: 'us1', lang: 'en_US', description: 'US English male', platform: 'linux', engine: 'festival' },
            { name: 'us2', lang: 'en_US', description: 'US English female', platform: 'linux', engine: 'festival' },
            { name: 'us3', lang: 'en_US', description: 'US English male', platform: 'linux', engine: 'festival' }
        ];
    }

    async getSpdVoices() {
        try {
            const { stdout } = await execAsync('spd-say -O');
            const voices = stdout.split('\n')
                .filter(line => line.trim())
                .map(name => ({
                    name: name.trim(),
                    lang: 'unknown',
                    description: `Speech Dispatcher voice: ${name}`,
                    platform: 'linux',
                    engine: 'spd-say'
                }));
            return voices;
        } catch {
            return [
                { name: 'default', lang: 'en', description: 'Default voice', platform: 'linux', engine: 'spd-say' }
            ];
        }
    }

    isJapaneseVoice(voiceName) {
        const japanesePatterns = [
            /ja/i,
            /japanese/i,
            /japan/i,
            /jp/i,
            /日本語/i
        ];
        
        return japanesePatterns.some(pattern => pattern.test(voiceName));
    }

    getDefaultJapaneseVoice() {
        // espeak での日本語音声
        return 'ja';
    }

    getDefaultEnglishVoice() {
        // espeak での英語音声
        return 'en';
    }

    showInstallInstructions() {
        console.error('音声合成エンジンが見つかりません。以下のいずれかをインストールしてください:\n');
        
        const distro = detectLinuxDistribution();
        
        this.supportedEngines.forEach((engine, index) => {
            console.error(`${index + 1}. ${engine.package} (推奨度: ${5 - engine.priority}/4)`);
            console.error(`   ${engine.description}`);
            console.error(`   ${this.getInstallCommand(distro, engine.package)}`);
            console.error('');
        });
        
        console.error('インストール後、再度実行してください。');
        console.error('');
        console.error('注意: 日本語音声を使用するには、追加で言語パックのインストールが必要な場合があります。');
    }

    getInstallCommand(distro, packageName) {
        const commands = {
            debian: `sudo apt-get install ${packageName}`,
            redhat: `sudo yum install ${packageName}`,
            arch: `sudo pacman -S ${packageName}`,
            alpine: `sudo apk add ${packageName}`,
            suse: `sudo zypper install ${packageName}`,
            unknown: `# パッケージマネージャーで ${packageName} をインストール`
        };
        return commands[distro] || commands.unknown;
    }

    // 日本語文字（ひらがな、カタカナ、漢字）を検出
    isJapanese(text) {
        return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    }

    /**
     * トークン化されたテキストを読み上げ
     * @param {Array} tokens トークン配列
     * @param {Object} options オプション
     */
    async speakTokenized(tokens, options = {}) {
        const { voice, rate } = options;
        
        // 指定された音声が日本語音声か英語音声かを判定
        let isSpecifiedVoiceJapanese = null;
        if (voice) {
            if (await this.isVoiceAvailable(voice)) {
                isSpecifiedVoiceJapanese = this.isJapaneseVoice(voice);
            } else {
                console.warn(`警告: 音声 "${voice}" は利用できません。デフォルト音声を使用します。`);
            }
        }
        
        for (const token of tokens) {
            if (token.text.trim()) {
                let selectedVoice;
                
                if (token.isJapanese) {
                    // 日本語トークンの場合
                    selectedVoice = (voice && isSpecifiedVoiceJapanese === true) ? voice : this.getDefaultJapaneseVoice();
                } else {
                    // 英語トークンの場合
                    selectedVoice = (voice && isSpecifiedVoiceJapanese === false) ? voice : this.getDefaultEnglishVoice();
                }
                
                await this.speak(token.text, { voice: selectedVoice, rate });
            }
        }
        
        return true;
    }
}

module.exports = LinuxVoiceEngine;