/**
 * 音声エンジンの基底クラス
 * 各プラットフォーム用の実装はこのクラスを継承する
 */

class VoiceEngine {
    constructor() {
        this.platform = null;
        this.availableVoices = [];
        this.isInitialized = false;
    }

    /**
     * 音声エンジンを初期化
     * サブクラスで実装必須
     */
    async initialize() {
        throw new Error('initialize() must be implemented by subclass');
    }

    /**
     * テキストを音声で読み上げ
     * @param {string} text 読み上げるテキスト
     * @param {Object} options オプション
     * @param {string} options.voice 音声名
     * @param {number} options.rate 読み上げ速度
     * @returns {Promise<boolean>} 成功したかどうか
     */
    async speak(text, options = {}) {
        throw new Error('speak() must be implemented by subclass');
    }

    /**
     * 利用可能な音声リストを取得
     * @returns {Promise<Array>} 音声リスト
     */
    async getAvailableVoices() {
        throw new Error('getAvailableVoices() must be implemented by subclass');
    }

    /**
     * 音声が日本語音声かどうかを判定
     * @param {string} voiceName 音声名
     * @returns {boolean|null} 日本語音声ならtrue、英語音声ならfalse、不明ならnull
     */
    isJapaneseVoice(voiceName) {
        throw new Error('isJapaneseVoice() must be implemented by subclass');
    }

    /**
     * 音声が利用可能かどうかをチェック
     * @param {string} voiceName 音声名
     * @returns {Promise<boolean>} 利用可能かどうか
     */
    async isVoiceAvailable(voiceName) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        const voices = await this.getAvailableVoices();
        return voices.some(voice => voice.name === voiceName);
    }

    /**
     * デフォルト音声を取得
     * @param {boolean} isJapanese 日本語かどうか
     * @returns {string} デフォルト音声名
     */
    getDefaultVoice(isJapanese) {
        return isJapanese ? this.getDefaultJapaneseVoice() : this.getDefaultEnglishVoice();
    }

    /**
     * デフォルト日本語音声を取得
     * サブクラスで実装
     */
    getDefaultJapaneseVoice() {
        throw new Error('getDefaultJapaneseVoice() must be implemented by subclass');
    }

    /**
     * デフォルト英語音声を取得
     * サブクラスで実装
     */
    getDefaultEnglishVoice() {
        throw new Error('getDefaultEnglishVoice() must be implemented by subclass');
    }

    /**
     * エラーメッセージをフォーマット
     * @param {Error} error エラーオブジェクト
     * @returns {string} フォーマットされたエラーメッセージ
     */
    formatError(error) {
        return `音声出力エラー (${this.platform}): ${error.message}`;
    }

    /**
     * 音声エンジンが利用可能かチェック
     * サブクラスで実装
     */
    async checkAvailability() {
        throw new Error('checkAvailability() must be implemented by subclass');
    }

    /**
     * インストール手順を表示
     * サブクラスで実装
     */
    showInstallInstructions() {
        throw new Error('showInstallInstructions() must be implemented by subclass');
    }
}

module.exports = VoiceEngine;