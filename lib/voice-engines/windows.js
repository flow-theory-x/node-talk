/**
 * Windows用音声エンジン実装
 * PowerShell + System.Speech.Synthesis を使用
 */

const { promisify } = require('util');
const { exec } = require('child_process');
const VoiceEngine = require('./base');
const { isCommandAvailable } = require('../platform-detector');

const execAsync = promisify(exec);

class WindowsVoiceEngine extends VoiceEngine {
    constructor() {
        super();
        this.platform = 'windows';
    }

    async initialize() {
        if (this.isInitialized) return;
        
        const available = await this.checkAvailability();
        if (!available) {
            throw new Error('PowerShell or System.Speech is not available on this Windows system');
        }
        
        this.availableVoices = await this.getAvailableVoices();
        this.isInitialized = true;
    }

    async checkAvailability() {
        try {
            // PowerShellが利用可能かチェック
            if (!isCommandAvailable('powershell')) {
                return false;
            }
            
            // System.Speech.Synthesisが利用可能かチェック
            const testCommand = `powershell -Command "try { Add-Type -AssemblyName System.Speech; Write-Output 'OK' } catch { Write-Output 'NG' }"`;
            const { stdout } = await execAsync(testCommand);
            return stdout.trim() === 'OK';
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
            let selectedVoice;
            const isTextJapanese = this.isJapanese(text);
            
            if (voice) {
                selectedVoice = voice;
            } else {
                selectedVoice = isTextJapanese ? this.getDefaultJapaneseVoice() : this.getDefaultEnglishVoice();
            }
            
            // PowerShellコマンドを構築
            let command = `powershell -Command "Add-Type -AssemblyName System.Speech; $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;`;
            
            // 音声を設定（利用可能な場合のみ）
            command += ` try { $synth.SelectVoice('${selectedVoice}') } catch { Write-Warning 'Voice not found, using default' };`;
            
            // 速度を設定
            if (rate) {
                // Windows TTS の速度は -10 から 10 の範囲
                const windowsRate = Math.max(-10, Math.min(10, Math.round((rate - 200) / 20)));
                command += ` $synth.Rate = ${windowsRate};`;
            }
            
            // テキストを読み上げ
            command += ` $synth.Speak('${text.replace(/'/g, "''")}')\"`;
            
            await execAsync(command);
            return true;
        } catch (error) {
            throw new Error(this.formatError(error));
        }
    }

    async getAvailableVoices() {
        try {
            const command = `powershell -Command "Add-Type -AssemblyName System.Speech; [System.Speech.Synthesis.SpeechSynthesizer]::new().GetInstalledVoices() | ForEach-Object { $voice = $_.VoiceInfo; Write-Output ($voice.Name + '|' + $voice.Culture + '|' + $voice.Gender + '|' + $voice.Description) }"`;
            
            const { stdout } = await execAsync(command);
            const voices = stdout.split('\n')
                .filter(line => line.trim())
                .map(line => {
                    const [name, culture, gender, description] = line.split('|');
                    return {
                        name: name?.trim(),
                        lang: culture?.trim(),
                        gender: gender?.trim(),
                        description: description?.trim(),
                        platform: 'windows'
                    };
                })
                .filter(voice => voice.name);
            
            return voices;
        } catch (error) {
            console.warn(`警告: 音声リストの取得に失敗しました: ${error.message}`);
            return [];
        }
    }

    isJapaneseVoice(voiceName) {
        // Windows の日本語音声パターン
        const japanesePatterns = [
            /haruka/i,
            /ayumi/i,
            /ichiro/i,
            /sayaka/i,
            /ja-JP/i,
            /japanese/i,
            /日本語/i
        ];
        
        return japanesePatterns.some(pattern => pattern.test(voiceName));
    }

    getDefaultJapaneseVoice() {
        // Windows の一般的な日本語音声
        return 'Microsoft Haruka Desktop';
    }

    getDefaultEnglishVoice() {
        // Windows の一般的な英語音声
        return 'Microsoft Zira Desktop';
    }

    showInstallInstructions() {
        console.error('Windowsでは以下を確認してください:');
        console.error('');
        console.error('1. PowerShellが利用可能か確認:');
        console.error('   コマンドプロンプトで "powershell" を実行');
        console.error('');
        console.error('2. 音声合成機能が有効か確認:');
        console.error('   設定 > 時刻と言語 > 音声');
        console.error('');
        console.error('3. 日本語音声パックをインストール:');
        console.error('   設定 > 時刻と言語 > 言語 > 日本語を追加');
        console.error('   またはWindows Updateで言語パックを取得');
        console.error('');
        console.error('4. .NET Frameworkが最新かどうか確認');
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

module.exports = WindowsVoiceEngine;