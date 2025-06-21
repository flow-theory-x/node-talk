#!/usr/bin/env node

const { speakTokenized, getAvailableVoices, getPlatform } = require('./index');

// プラットフォーム別の音声リスト表示
async function displayVoiceList() {
    try {
        const voices = await getAvailableVoices();
        const platformInfo = getPlatform();
        
        console.log(`\n利用可能な音声リスト (${platformInfo.platform})\n`);
        
        const japaneseVoices = voices.filter(v => 
            v.lang === 'ja_JP' || 
            v.name.includes('日本語') || 
            v.lang === 'ja'
        );
        const englishVoices = voices.filter(v => 
            v.lang && v.lang.startsWith('en') && 
            !v.name.includes('日本語')
        );
        
        console.log('日本語音声:');
        if (japaneseVoices.length > 0) {
            japaneseVoices.forEach(v => console.log(`  ${v.name}${v.engine ? ` (${v.engine})` : ''}`));
        } else {
            console.log('  利用可能な日本語音声がありません');
        }
        
        console.log('\n英語音声:');
        if (englishVoices.length > 0) {
            englishVoices.forEach(v => console.log(`  ${v.name}${v.lang ? ` (${v.lang})` : ''}${v.engine ? ` [${v.engine}]` : ''}`));
        } else {
            console.log('  利用可能な英語音声がありません');
        }
        
        return { japaneseVoices, englishVoices };
    } catch (error) {
        console.error('音声リストの取得に失敗しました:', error.message);
        return { japaneseVoices: [], englishVoices: [] };
    }
}

// ヘルプメッセージを表示
async function showHelp() {
    const platformInfo = getPlatform();
    
    console.log(`
node-talk - クロスプラットフォーム対応音声合成ツール (${platformInfo.platform})

使用方法:
  talk <テキスト>                    指定したテキストを読み上げます
  talk -v <音声名> <テキスト>         指定した音声で読み上げます
  talk -r <速度> <テキスト>           指定した速度で読み上げます
  talk -h, --help                  このヘルプメッセージを表示します
  talk --voices                    利用可能な音声リストを表示します

機能:
  - 日本語と英語を自動判別して適切な音声で読み上げ
  - 混在したテキストも単語ごとに適切な音声で読み上げ
  - Windows、macOS、Linux対応

例:
  talk こんにちは
  talk Hello world
  talk "Hello 世界! This is 日本語 mixed with English."
  talk -v Fred "Hello world"
  talk -v Kyoko "こんにちは世界"
  talk -r 300 "高速で読み上げます"

注意:
  - 括弧を含む音声名は引用符で囲んでください
  - 利用可能な音声は環境によって異なります
  - 'talk --voices' で音声リストを確認できます
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
    showHelp().then(() => process.exit(0));
    return;
}

if (args[0] === '--voices') {
    displayVoiceList().then(() => {
        console.log('\n※ 括弧を含む音声名は引用符で囲んでください');
        console.log('例: talk -v "音声名" "テキスト"');
        console.log();
        process.exit(0);
    });
    return;
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
