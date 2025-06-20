// talk.jsモジュールの使用例

const { speak, isJapanese } = require('./talk');

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