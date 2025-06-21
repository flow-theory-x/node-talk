/**
 * macOS用音声エンジン実装
 * sayコマンドを使用
 */

const { execSync } = require('child_process');
const { promisify } = require('util');
const { exec } = require('child_process');
const VoiceEngine = require('./base');

const execAsync = promisify(exec);

class MacOSVoiceEngine extends VoiceEngine {
    constructor() {
        super();
        this.platform = 'macos';
    }

    async initialize() {
        if (this.isInitialized) return;
        
        const available = await this.checkAvailability();
        if (!available) {
            throw new Error('say command is not available on this macOS system');
        }
        
        this.availableVoices = await this.getAvailableVoices();
        this.isInitialized = true;
    }

    async checkAvailability() {
        try {
            execSync('which say', { stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    async speak(text, options = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const { voice, rate } = options;
        
        try {
            let command;
            const isTextJapanese = this.isJapanese(text);
            
            if (isTextJapanese) {
                const japaneseVoice = voice || this.getDefaultJapaneseVoice();
                const japaneseRate = rate || 200;
                command = `say -v "${japaneseVoice}" -r ${japaneseRate} "${text.replace(/"/g, '\\"')}"`;
            } else {
                const englishVoice = voice || this.getDefaultEnglishVoice();
                const voiceOption = rate ? ` -r ${rate}` : '';
                command = `say -v "${englishVoice}"${voiceOption} "${text.replace(/"/g, '\\"')}"`;
            }
            
            await execAsync(command);
            return true;
        } catch (error) {
            throw new Error(this.formatError(error));
        }
    }

    async getAvailableVoices() {
        try {
            const voicesOutput = execSync("say -v '?'", { encoding: 'utf8' });
            const voices = voicesOutput.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const match = line.match(/^(.+?)\s+([a-z]{2}_[A-Z]{2})\s+#\s+(.+)$/);
                    if (match) {
                        return {
                            name: match[1].trim(),
                            lang: match[2],
                            sample: match[3],
                            platform: 'macos'
                        };
                    }
                    return null;
                })
                .filter(voice => voice !== null);
            
            return voices;
        } catch (error) {
            console.warn(`警告: 音声リストの取得に失敗しました: ${error.message}`);
            return [];
        }
    }

    isJapaneseVoice(voiceName) {
        // 日本語音声のパターン
        const japaneseVoices = [
            'kyoko', 'otoya', 'kyoto',
            /.*\(日本語/i,
            /.*ja_JP/i
        ];
        
        const lowerVoice = voiceName.toLowerCase();
        return japaneseVoices.some(pattern => {
            if (typeof pattern === 'string') {
                return lowerVoice === pattern;
            } else {
                return pattern.test(voiceName);
            }
        });
    }

    getDefaultJapaneseVoice() {
        return 'kyoto';
    }

    getDefaultEnglishVoice() {
        return 'Samantha';
    }

    showInstallInstructions() {
        console.error('macOSでは標準でsayコマンドが利用可能です。');
        console.error('もしsayコマンドが見つからない場合は、macOSを最新版に更新してください。');
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
        const commands = [];
        
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
                if (token.isJapanese) {
                    // 日本語トークンの場合
                    const japaneseVoice = (voice && isSpecifiedVoiceJapanese === true) ? voice : this.getDefaultJapaneseVoice();
                    const japaneseRate = rate || 200;
                    commands.push(`say -v "${japaneseVoice}" -r ${japaneseRate} "${token.text.replace(/"/g, '\\"')}"`);
                } else {
                    // 英語トークンの場合
                    const englishVoice = (voice && isSpecifiedVoiceJapanese === false) ? voice : this.getDefaultEnglishVoice();
                    const voiceOption = rate ? ` -r ${rate}` : '';
                    commands.push(`say -v "${englishVoice}"${voiceOption} "${token.text.replace(/"/g, '\\"')}"`);
                }
            }
        }
        
        // コマンドを連続実行
        for (const command of commands) {
            await execAsync(command);
        }
        
        return true;
    }
}

module.exports = MacOSVoiceEngine;