// node-talkモジュールの使用例

const { speak, speakTokenized, isJapanese, tokenizeText } = require('./index');

// 基本的な使い方
speak('こんにちは！');
speak('Hello world!');

// オプションを指定
speak('ゆっくり話します', { rate: 100 });
speak('This is fast speech', { rate: 300 });

// 別の音声を使用
speak('違う声で話します', { voice: 'Kyoko' });
speak('Different voice', { voice: 'Alex' });

// 日本語判定機能の使用
console.log(isJapanese('こんにちは')); // true
console.log(isJapanese('Hello')); // false
console.log(isJapanese('Hello世界')); // true (日本語が含まれている)

// トークン分割機能の使用
console.log('\n--- トークン分割の例 ---');
const mixedText = 'Hello世界！ This is 日本語 mixed with English.';
const tokens = tokenizeText(mixedText);
console.log('トークン:', tokens);

// 混在テキストの読み上げ（トークンごとに適切な音声で読み上げ）
console.log('\n--- 混在テキストの読み上げ ---');
(async () => {
    // 全体を一つの言語として判定（従来の動作）
    console.log('従来の方法:');
    speak('Hello世界！ This is 日本語 mixed with English.');
    
    // トークンごとに言語を判定して読み上げ（新機能）
    console.log('新しい方法（トークン分割）:');
    await speakTokenized('Hello世界！ This is 日本語 mixed with English.', { tokenize: true });
    
    // カスタムオプション付き
    await speakTokenized('おはよう Good morning みなさん!', { 
        tokenize: true,
        rate: 150
    });
})();