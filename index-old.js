const { execSync } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 日本語文字（ひらがな、カタカナ、漢字）を検出
function isJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

// 利用可能な音声リストを取得
function getAvailableVoices() {
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
                        sample: match[3]
                    };
                }
                return null;
            })
            .filter(voice => voice !== null);
        
        return voices;
    } catch (error) {
        return [];
    }
}

// 音声が利用可能かどうかをチェック
function isVoiceAvailable(voiceName) {
    const availableVoices = getAvailableVoices();
    return availableVoices.some(voice => voice.name === voiceName);
}

// 音声が日本語音声かどうかを判定
function isJapaneseVoice(voiceName) {
    // まず利用可能な音声かチェック
    if (!isVoiceAvailable(voiceName)) {
        return null; // 利用不可な音声
    }
    
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

// テキストをトークンに分割する関数
function tokenizeText(text) {
    const tokens = [];
    let currentToken = '';
    let isCurrentJapanese = null;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charIsJapanese = isJapanese(char);
        
        // 言語が切り替わった場合
        if (isCurrentJapanese !== null && isCurrentJapanese !== charIsJapanese) {
            // 空白文字の処理
            if (/\s/.test(char)) {
                // 現在のトークンが英語の場合、空白を含める
                if (!isCurrentJapanese) {
                    currentToken += char;
                } else {
                    // 日本語の場合は区切る
                    tokens.push({ text: currentToken, isJapanese: isCurrentJapanese });
                    currentToken = char;
                    isCurrentJapanese = false;
                }
            } else {
                // 通常の言語切り替え
                tokens.push({ text: currentToken, isJapanese: isCurrentJapanese });
                currentToken = char;
                isCurrentJapanese = charIsJapanese;
            }
        }
        // 同じ言語が続く場合
        else {
            currentToken += char;
            if (isCurrentJapanese === null) {
                isCurrentJapanese = charIsJapanese;
            }
        }
    }
    
    // 最後のトークンを追加
    if (currentToken) {
        tokens.push({ text: currentToken, isJapanese: isCurrentJapanese });
    }
    
    return tokens;
}

// トークンごとに音声合成を実行
async function speakTokenized(text, options = {}) {
    const { voice, rate, tokenize = false } = options;
    
    if (!tokenize) {
        // 従来の動作
        return speak(text, { voice, rate });
    }
    
    const tokens = tokenizeText(text);
    const commands = [];
    
    // 指定された音声が日本語音声か英語音声かを判定
    const isSpecifiedVoiceJapanese = voice ? isJapaneseVoice(voice) : null;
    
    // 利用不可な音声が指定された場合の警告
    if (voice && isSpecifiedVoiceJapanese === null) {
        console.warn(`警告: 音声 "${voice}" は利用できません。デフォルト音声を使用します。`);
    }
    
    for (const token of tokens) {
        if (token.text.trim()) {  // 空白のみのトークンは読み上げない
            if (token.isJapanese) {
                // 日本語トークンの場合
                const japaneseVoice = (voice && isSpecifiedVoiceJapanese === true) ? voice : 'kyoto';
                const japaneseRate = rate || 200;
                commands.push(`say -v "${japaneseVoice}" -r ${japaneseRate} "${token.text.replace(/"/g, '\\"')}"`);
            } else {
                // 英語トークンの場合
                const englishVoice = (voice && isSpecifiedVoiceJapanese === false) ? voice : 'Samantha';
                commands.push(`say -v "${englishVoice}"${rate ? ` -r ${rate}` : ''} "${token.text.replace(/"/g, '\\"')}"`);
            }
        }
    }
    
    // コマンドを連続実行
    try {
        for (const command of commands) {
            await execAsync(command);
        }
        return true;
    } catch (error) {
        throw new Error(`音声出力エラー: ${error.message}`);
    }
}

// メイン関数をモジュールとしてエクスポート
function speak(text, options = {}) {
    const { voice, rate } = options;
    
    try {
        let command;
        if (isJapanese(text)) {
            // 日本語の場合は日本語音声を使用（可愛い声で早口）
            const japaneseVoice = voice || 'kyoto';
            const japaneseRate = rate || 200;
            command = `say -v "${japaneseVoice}" -r ${japaneseRate} "${text.replace(/"/g, '\\"')}"`;
        } else {
            // 英語の場合は英語音声を使用
            const englishVoice = voice || 'Samantha';
            command = `say -v "${englishVoice}"${rate ? ` -r ${rate}` : ''} "${text.replace(/"/g, '\\"')}"`;
        }
        execSync(command);
        return true;
    } catch (error) {
        throw new Error(`音声出力エラー: ${error.message}`);
    }
}

// モジュールとしてエクスポート
module.exports = {
    speak,
    speakTokenized,
    isJapanese,
    tokenizeText,
    isJapaneseVoice,
    isVoiceAvailable,
    getAvailableVoices
};