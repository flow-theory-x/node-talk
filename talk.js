#!/usr/bin/env node

const { execSync } = require('child_process');

if (process.argv.length < 3) {
    console.log("使用方法: node talk.js <発言内容>");
    process.exit(1);
}

const text = process.argv.slice(2).join(' ');

// 日本語文字（ひらがな、カタカナ、漢字）を検出
function isJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

try {
    let command;
    if (isJapanese(text)) {
        // 日本語の場合は日本語音声を使用（可愛い声で早口）
        command = `say -v kyoto -r 200 "${text.replace(/"/g, '\\"')}"`;
    } else {
        // 英語の場合は英語音声を使用
        command = `say -v Samantha "${text.replace(/"/g, '\\"')}"`;
    }
    execSync(command);
} catch (error) {
    console.error("エラーが発生しました:", error.message);
    process.exit(1);
}
