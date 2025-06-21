/**
 * node-talk メインモジュール
 * クロスプラットフォーム対応版
 */

const VoiceEngineFactory = require('./lib/voice-engine-factory');
const { isJapanese, tokenizeText } = require('./lib/text-tokenizer');
const { getPlatformInfo } = require('./lib/platform-detector');

// グローバル音声エンジンインスタンス
let globalVoiceEngine = null;

/**
 * 音声エンジンを取得（遅延初期化）
 * @returns {Promise<VoiceEngine>} 音声エンジン
 */
async function getVoiceEngine() {
    if (!globalVoiceEngine) {
        try {
            globalVoiceEngine = await VoiceEngineFactory.createAndInitialize();
        } catch (error) {
            console.error('音声エンジンの初期化に失敗しました:', error.message);
            
            // プラットフォーム固有のヘルプを表示
            try {
                const engine = VoiceEngineFactory.createEngine();
                engine.showInstallInstructions();
            } catch {}
            
            throw error;
        }
    }
    return globalVoiceEngine;
}

/**
 * テキストを音声で読み上げます
 * @param {string} text 読み上げるテキスト
 * @param {Object} options オプション設定
 * @param {string} options.voice 使用する音声の名前
 * @param {number} options.rate 読み上げ速度
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function speak(text, options = {}) {
    const engine = await getVoiceEngine();
    return await engine.speak(text, options);
}

/**
 * 混在したテキストをトークンごとに分割し、それぞれ適切な音声で読み上げます
 * @param {string} text 読み上げるテキスト
 * @param {Object} options オプション設定
 * @param {boolean} options.tokenize トークン分割を有効にする（デフォルト: false）
 * @param {string} options.voice 使用する音声の名前（言語別に適用）
 * @param {number} options.rate 読み上げ速度
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function speakTokenized(text, options = {}) {
    const { tokenize = false } = options;
    
    if (!tokenize) {
        // 従来の動作
        return await speak(text, options);
    }
    
    const engine = await getVoiceEngine();
    const tokens = tokenizeText(text);
    
    return await engine.speakTokenized(tokens, options);
}

/**
 * 利用可能な音声リストを取得
 * @returns {Promise<Array>} 音声リスト
 */
async function getAvailableVoices() {
    const engine = await getVoiceEngine();
    return await engine.getAvailableVoices();
}

/**
 * 音声が利用可能かどうかをチェック
 * @param {string} voiceName 音声名
 * @returns {Promise<boolean>} 利用可能かどうか
 */
async function isVoiceAvailable(voiceName) {
    const engine = await getVoiceEngine();
    return await engine.isVoiceAvailable(voiceName);
}

/**
 * 音声が日本語音声かどうかを判定
 * @param {string} voiceName 音声名
 * @returns {Promise<boolean|null>} 日本語音声ならtrue、英語音声ならfalse、不明ならnull
 */
async function isJapaneseVoice(voiceName) {
    const engine = await getVoiceEngine();
    return engine.isJapaneseVoice(voiceName);
}

/**
 * プラットフォーム情報を取得
 * @returns {Object} プラットフォーム情報
 */
function getPlatform() {
    return getPlatformInfo();
}

/**
 * 音声エンジンの状態をリセット（テスト用）
 */
function resetEngine() {
    globalVoiceEngine = null;
}

// モジュールとしてエクスポート
module.exports = {
    speak,
    speakTokenized,
    getAvailableVoices,
    isVoiceAvailable,
    isJapaneseVoice,
    isJapanese,
    tokenizeText,
    getPlatform,
    resetEngine
};