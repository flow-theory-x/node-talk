#!/usr/bin/env node

const { execSync } = require('child_process');

// 日本語文字（ひらがな、カタカナ、漢字）を検出
function isJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
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
    isJapanese
};

// CLIとして実行された場合
if (require.main === module) {
    if (process.argv.length < 3) {
        console.log("使用方法: node talk.js <発言内容>");
        process.exit(1);
    }

    const text = process.argv.slice(2).join(' ');
    
    try {
        speak(text);
    } catch (error) {
        console.error("エラーが発生しました:", error.message);
        process.exit(1);
    }
}
