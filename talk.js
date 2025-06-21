#!/usr/bin/env node

const { speakTokenized } = require('./index');
const { execSync } = require('child_process');

// 利用可能な音声リストを取得
function getAvailableVoices() {
    try {
        const voicesOutput = execSync("say -v '?'", { encoding: 'utf8' });
        const voices = voicesOutput.split('\n')
            .filter(line => line.trim())
            .map(line => {
                const match = line.match(/^([^\s]+)\s+([^\s]+)\s+#\s+(.+)$/);
                if (match) {
                    return {
                        name: match[1],
                        lang: match[2],
                        sample: match[3]
                    };
                }
                return null;
            })
            .filter(voice => voice !== null);
        
        const japaneseVoices = voices.filter(v => v.lang === 'ja_JP');
        const englishVoices = voices.filter(v => v.lang.startsWith('en_'));
        
        return { japaneseVoices, englishVoices };
    } catch (error) {
        return { japaneseVoices: [], englishVoices: [] };
    }
}

// ヘルプメッセージを表示
function showHelp() {
    const { japaneseVoices, englishVoices } = getAvailableVoices();
    
    console.log(`
node-talk - macOS向け日本語/英語音声合成ツール

使用方法:
  talk <テキスト>              指定したテキストを読み上げます
  talk -h, --help            このヘルプメッセージを表示します
  talk --voices              利用可能な音声リストを表示します

機能:
  - 日本語と英語を自動判別して適切な音声で読み上げ
  - 混在したテキストも単語ごとに適切な音声で読み上げ

例:
  talk こんにちは
  talk Hello world
  talk "Hello 世界! This is 日本語 mixed with English."

デフォルト音声:
  - 日本語: kyoto (女性音声、速度200)
  - 英語: Samantha (女性音声)

利用可能な日本語音声:
${japaneseVoices.map(v => `  - ${v.name}`).join('\n')}

利用可能な英語音声 (主要なもの):
${englishVoices.filter(v => ['Alex', 'Samantha', 'Victoria', 'Fred', 'Karen'].includes(v.name)).map(v => `  - ${v.name} (${v.lang})`).join('\n')}
`);
}

// コマンドライン引数を処理
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log("使用方法: talk <発言内容>");
    console.log("詳細は 'talk --help' を参照してください。");
    process.exit(1);
}

if (args[0] === '-h' || args[0] === '--help') {
    showHelp();
    process.exit(0);
}

if (args[0] === '--voices') {
    const { japaneseVoices, englishVoices } = getAvailableVoices();
    console.log('\n利用可能な音声リスト\n');
    console.log('日本語音声:');
    japaneseVoices.forEach(v => console.log(`  ${v.name}`));
    console.log('\n英語音声:');
    englishVoices.forEach(v => console.log(`  ${v.name} (${v.lang})`));
    console.log();
    process.exit(0);
}

const text = args.join(' ');

(async () => {
    try {
        // トークン分割機能を使用して読み上げ
        await speakTokenized(text, { tokenize: true });
    } catch (error) {
        console.error("エラーが発生しました:", error.message);
        process.exit(1);
    }
})();
