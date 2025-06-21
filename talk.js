#!/usr/bin/env node

const { speakTokenized } = require('./index');

if (process.argv.length < 3) {
    console.log("使用方法: talk <発言内容>");
    process.exit(1);
}

const text = process.argv.slice(2).join(' ');

(async () => {
    try {
        // トークン分割機能を使用して読み上げ
        await speakTokenized(text, { tokenize: true });
    } catch (error) {
        console.error("エラーが発生しました:", error.message);
        process.exit(1);
    }
})();
