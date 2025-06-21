const { execSync } = require('child_process');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 日本語文字（ひらがな、カタカナ、漢字）を検出
function isJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
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
    
    for (const token of tokens) {
        if (token.text.trim()) {  // 空白のみのトークンは読み上げない
            if (token.isJapanese) {
                const japaneseVoice = voice || 'kyoto';
                const japaneseRate = rate || 200;
                commands.push(`say -v ${japaneseVoice} -r ${japaneseRate} "${token.text.replace(/"/g, '\\"\\')}"`);
            } else {
                const englishVoice = voice || 'Samantha';
                commands.push(`say -v ${englishVoice}${rate ? ` -r ${rate}` : ''} "${token.text.replace(/"/g, '\\"\\')}"`);
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
            command = `say -v ${japaneseVoice} -r ${japaneseRate} "${text.replace(/"/g, '\\"')}"`;
        } else {
            // 英語の場合は英語音声を使用
            const englishVoice = voice || 'Samantha';
            command = `say -v ${englishVoice}${rate ? ` -r ${rate}` : ''} "${text.replace(/"/g, '\\"')}"`;
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
    tokenizeText
};