/**
 * プラットフォーム検出とOS情報取得
 */

const fs = require('fs');
const { execSync } = require('child_process');

/**
 * 現在のプラットフォームを取得
 * @returns {'macos'|'windows'|'linux'} プラットフォーム名
 */
function getPlatform() {
    switch (process.platform) {
        case 'darwin': return 'macos';
        case 'win32': return 'windows';
        case 'linux': return 'linux';
        default: throw new Error(`Unsupported platform: ${process.platform}`);
    }
}

/**
 * Linuxディストリビューションを検出
 * @returns {string} ディストリビューション名
 */
function detectLinuxDistribution() {
    try {
        const release = fs.readFileSync('/etc/os-release', 'utf8');
        if (release.includes('ubuntu') || release.includes('debian')) return 'debian';
        if (release.includes('centos') || release.includes('rhel') || release.includes('fedora')) return 'redhat';
        if (release.includes('arch')) return 'arch';
        if (release.includes('alpine')) return 'alpine';
        if (release.includes('suse')) return 'suse';
    } catch {
        // /etc/os-release が読めない場合の代替手段
        try {
            const uname = execSync('uname -a', { encoding: 'utf8' }).toLowerCase();
            if (uname.includes('ubuntu') || uname.includes('debian')) return 'debian';
            if (uname.includes('red hat') || uname.includes('centos')) return 'redhat';
        } catch {}
    }
    return 'unknown';
}

/**
 * コマンドが利用可能かチェック
 * @param {string} command チェックするコマンド名
 * @returns {boolean} 利用可能かどうか
 */
function isCommandAvailable(command) {
    try {
        const checkCommand = process.platform === 'win32' 
            ? `where ${command}` 
            : `which ${command}`;
        execSync(checkCommand, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * プラットフォーム情報を取得
 * @returns {Object} プラットフォーム情報
 */
function getPlatformInfo() {
    const platform = getPlatform();
    const info = {
        platform,
        arch: process.arch,
        nodeVersion: process.version
    };

    if (platform === 'linux') {
        info.distribution = detectLinuxDistribution();
    }

    return info;
}

module.exports = {
    getPlatform,
    detectLinuxDistribution,
    isCommandAvailable,
    getPlatformInfo
};