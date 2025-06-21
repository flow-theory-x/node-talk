# node-talk

macOS向けの日本語/英語音声合成モジュール。テキストを音声で読み上げます。

## インストール

```bash
npm install node-talk
```

グローバルインストール（CLIツールとして使用）:
```bash
npm install -g node-talk
```

## 使い方

### モジュールとして使用

```javascript
const { speak, isJapanese } = require('node-talk');

// 基本的な使い方
speak('こんにちは！');
speak('Hello world!');

// オプションを指定
speak('ゆっくり話します', { rate: 100 });
speak('This is fast speech', { rate: 300 });

// 別の音声を使用
speak('違う声で話します', { voice: 'Kyoko' });
speak('Different voice', { voice: 'Alex' });

// 日本語判定機能
console.log(isJapanese('こんにちは')); // true
console.log(isJapanese('Hello')); // false
```

### CLIツールとして使用

```bash
talk こんにちは
talk Hello world
```

## API

### speak(text, options)

テキストを音声で読み上げます。

- `text` (string): 読み上げるテキスト
- `options` (object): オプション設定
  - `voice` (string): 使用する音声の名前
  - `rate` (number): 読み上げ速度（1分間あたりの単語数）

日本語テキストの場合、デフォルトで`kyoto`音声（速度200）が使用されます。
英語テキストの場合、デフォルトで`Samantha`音声が使用されます。

### speakTokenized(text, options)

混在したテキストをトークンごとに分割し、それぞれ適切な音声で読み上げます。

- `text` (string): 読み上げるテキスト
- `options` (object): オプション設定
  - `tokenize` (boolean): トークン分割を有効にする（デフォルト: false）
  - `voice` (string): 使用する音声の名前
  - `rate` (number): 読み上げ速度

```javascript
// 日本語と英語が混在したテキストを適切に読み上げ
await speakTokenized('Hello世界！ This is 日本語 mixed with English.', { tokenize: true });
```

### isJapanese(text)

テキストに日本語（ひらがな、カタカナ、漢字）が含まれているかを判定します。

- `text` (string): 判定するテキスト
- 戻り値 (boolean): 日本語が含まれている場合は`true`

### tokenizeText(text)

テキストを言語ごとのトークンに分割します。

- `text` (string): 分割するテキスト
- 戻り値 (array): トークンオブジェクトの配列
  - `text` (string): トークンのテキスト
  - `isJapanese` (boolean): 日本語かどうか

```javascript
const tokens = tokenizeText('Hello世界！');
// [
//   { text: 'Hello', isJapanese: false },
//   { text: '世界', isJapanese: true },
//   { text: '！', isJapanese: false }
// ]
```

## 必要環境

- macOS（`say`コマンドを使用）
- Node.js >= 12.0.0

## ライセンス

MIT