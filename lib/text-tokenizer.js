/**
 * テキストのトークン化機能
 * 日本語と英語が混在したテキストを言語ごとに分割
 */

/**
 * 日本語文字（ひらがな、カタカナ、漢字）を検出
 * @param {string} text 判定するテキスト
 * @returns {boolean} 日本語が含まれている場合はtrue
 */
function isJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
}

/**
 * テキストをトークンに分割する関数
 * @param {string} text 分割するテキスト
 * @returns {Array} トークンオブジェクトの配列
 */
function tokenizeText(text) {
    const tokens = [];
    let currentToken = '';
    let isCurrentJapanese = null;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const charIsJapanese = isJapanese(char);
        
        // 言語が切り替わった場合
        if (isCurrentJapanese !== null && isCurrentJapanese !== charIsJapanese) {
            // 空白文字の処理
            if (/\s/.test(char)) {
                // 現在のトークンが英語の場合、空白を含める
                if (!isCurrentJapanese) {
                    currentToken += char;
                } else {
                    // 日本語の場合は区切る
                    tokens.push({ text: currentToken, isJapanese: isCurrentJapanese });
                    currentToken = char;
                    isCurrentJapanese = false;
                }
            } else {
                // 通常の言語切り替え
                tokens.push({ text: currentToken, isJapanese: isCurrentJapanese });
                currentToken = char;
                isCurrentJapanese = charIsJapanese;
            }
        }
        // 同じ言語が続く場合
        else {
            currentToken += char;
            if (isCurrentJapanese === null) {
                isCurrentJapanese = charIsJapanese;
            }
        }
    }
    
    // 最後のトークンを追加
    if (currentToken) {
        tokens.push({ text: currentToken, isJapanese: isCurrentJapanese });
    }
    
    return tokens;
}

module.exports = {
    isJapanese,
    tokenizeText
};