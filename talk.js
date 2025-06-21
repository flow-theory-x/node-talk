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
                // 括弧を含む名前にも対応する正規表現
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
  talk <テキスト>                    指定したテキストを読み上げます
  talk -v <音声名> <テキスト>         指定した音声で読み上げます
  talk -r <速度> <テキスト>           指定した速度で読み上げます
  talk -h, --help                  このヘルプメッセージを表示します
  talk --voices                    利用可能な音声リストを表示します

機能:
  - 日本語と英語を自動判別して適切な音声で読み上げ
  - 混在したテキストも単語ごとに適切な音声で読み上げ

例:
  talk こんにちは
  talk Hello world
  talk "Hello 世界! This is 日本語 mixed with English."
  talk -v Alex "Hello world"
  talk -v "Reed (日本語（日本）)" "こんにちは世界"
  talk -r 300 "高速で読み上げます"

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
    console.log('\n※ 括弧を含む音声名は引用符で囲んでください');
    console.log('例: talk -v "Reed (日本語（日本）)" "こんにちは"');
    console.log();
    process.exit(0);
}

// オプションを解析
let voice = null;
let rate = null;
let textStartIndex = 0;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-v' && i + 1 < args.length) {
        voice = args[i + 1];
        textStartIndex = i + 2;
        i++; // 次の引数をスキップ
    } else if (args[i] === '-r' && i + 1 < args.length) {
        rate = parseInt(args[i + 1]);
        textStartIndex = i + 2;
        i++; // 次の引数をスキップ
    } else if (textStartIndex === 0) {
        textStartIndex = i;
        break;
    }
}

const text = args.slice(textStartIndex).join(' ');

if (!text) {
    console.log("エラー: 読み上げるテキストを指定してください。");
    console.log("詳細は 'talk --help' を参照してください。");
    process.exit(1);
}

(async () => {
    try {
        // トークン分割機能を使用して読み上げ
        const options = { tokenize: true };
        if (voice) options.voice = voice;
        if (rate) options.rate = rate;
        
        await speakTokenized(text, options);
    } catch (error) {
        console.error("エラーが発生しました:", error.message);
        process.exit(1);
    }
})();
