# node-talk

**クロスプラットフォーム対応**の日本語/英語音声合成モジュール。Windows、macOS、Linux対応でテキストを音声で読み上げます。

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
const { speak, speakTokenized, isJapanese, tokenizeText } = require('node-talk');

// 基本的な使い方
speak('こんにちは！');
speak('Hello world!');

// オプションを指定
speak('ゆっくり話します', { rate: 100 });
speak('This is fast speech', { rate: 300 });

// 別の音声を使用
speak('違う声で話します', { voice: 'Kyoko' });
speak('Different voice', { voice: 'Fred' });

// 混在したテキストをトークンごとに適切な音声で読み上げ
await speakTokenized('Hello世界！ This is 日本語 mixed with English.', { tokenize: true });

// カスタム音声を言語別に適用
await speakTokenized('Hello world こんにちは', { 
    tokenize: true,
    voice: 'Fred'  // 英語部分のみFredで読み上げ、日本語はデフォルト
});

// 日本語判定機能
console.log(isJapanese('こんにちは')); // true
console.log(isJapanese('Hello')); // false
```

### CLIツールとして使用

#### 基本的な使い方
```bash
ntalk こんにちは
ntalk Hello world
ntalk "Hello 世界! This is 日本語 mixed with English."
```

#### オプション
```bash
# カスタム音声を指定
ntalk -v Fred "Hello world"
ntalk -v Kyoko "こんにちは世界"
ntalk -v "Reed (日本語（日本）)" "こんにちは"  # 括弧付き音声名は引用符で囲む

# 読み上げ速度を指定
ntalk -r 300 "速く読み上げます"
ntalk -r 100 "ゆっくり読み上げます"

# 混在テキストで言語別に音声を適用
ntalk -v Fred "Hello world こんにちは世界"  # 英語部分のみFred、日本語はデフォルト

# ヘルプと音声リストを表示
ntalk --help
ntalk --voices
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
  - `voice` (string): 使用する音声の名前（言語別に適用）
  - `rate` (number): 読み上げ速度

```javascript
// 日本語と英語が混在したテキストを適切に読み上げ
await speakTokenized('Hello世界！ This is 日本語 mixed with English.', { tokenize: true });

// 英語音声を指定（英語部分のみに適用）
await speakTokenized('Hello world こんにちは', { 
    tokenize: true, 
    voice: 'Fred' 
});

// 日本語音声を指定（日本語部分のみに適用）
await speakTokenized('Hello world こんにちは', { 
    tokenize: true, 
    voice: 'Kyoko' 
});
```

**重要**: `voice`オプションは言語別に適用されます：
- 日本語音声を指定した場合：日本語部分のみその音声、英語部分はデフォルト
- 英語音声を指定した場合：英語部分のみその音声、日本語部分はデフォルト
- 利用できない音声を指定した場合：警告が表示され、すべてデフォルト音声を使用

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

## 特徴

- **自動言語判別**: 日本語と英語を自動で判別し、適切な音声で読み上げ
- **混在テキスト対応**: 「Hello 世界」のような混在テキストを単語レベルで適切に処理
- **言語別音声指定**: カスタム音声を指定した言語部分にのみ適用
- **フォールバック機能**: 存在しない音声を指定してもエラーにならず警告表示
- **豊富なCLIオプション**: 音声選択、速度調整、ヘルプ表示など

## 音声について

利用可能な音声は環境によって異なります。以下のコマンドで確認できます：

```bash
ntalk --voices
```

一般的な音声：
- **日本語**: Kyoko, Reed (日本語（日本）), Eddy (日本語（日本）)
- **英語**: Samantha, Fred, Karen, Daniel

括弧を含む音声名は引用符で囲んでください：
```bash
ntalk -v "Reed (日本語（日本）)" "こんにちは"
```

## 必要環境

- **共通**: Node.js >= 12.0.0
- **macOS**: 標準の`say`コマンド（プリインストール済み）
- **Windows**: PowerShell + .NET Framework
- **Linux**: 以下のいずれかの音声エンジン
  - `espeak-ng` (推奨)
  - `espeak`
  - `festival`
  - `speech-dispatcher`

### プラットフォーム別セットアップ

#### Windows
```bash
# 通常は追加インストール不要（PowerShellが標準搭載）
# 日本語音声を使用する場合:
# 設定 > 時刻と言語 > 言語 > 日本語を追加
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get install espeak-ng

# CentOS/RHEL/Fedora
sudo yum install espeak-ng

# Arch Linux
sudo pacman -S espeak-ng

# Alpine Linux
sudo apk add espeak-ng
```

#### macOS
```bash
# 追加インストール不要（sayコマンドが標準搭載）
```

## ライセンス

MIT