#!/usr/bin/env node
/**
 * プラットフォーム別の依存関係チェックスクリプト
 * インストール後に自動実行される
 */

const { getPlatform, isCommandAvailable, detectLinuxDistribution } = require('../lib/platform-detector');

function checkDependencies() {
    console.log('node-talk 依存関係チェック...');
    
    const platform = getPlatform();
    console.log(`プラットフォーム: ${platform}`);
    
    switch (platform) {
        case 'macos':
            return checkMacOSDependencies();
        case 'windows':
            return checkWindowsDependencies();
        case 'linux':
            return checkLinuxDependencies();
        default:
            console.error(`サポートされていないプラットフォーム: ${platform}`);
            return false;
    }
}

function checkMacOSDependencies() {
    if (isCommandAvailable('say')) {
        console.log('✓ sayコマンドが利用可能です');
        return true;
    } else {
        console.error('✗ sayコマンドが見つかりません');
        console.error('macOSを最新版に更新してください');
        return false;
    }
}

function checkWindowsDependencies() {
    if (isCommandAvailable('powershell')) {
        console.log('✓ PowerShellが利用可能です');
        console.log('注意: 音声合成を使用するには以下を確認してください:');
        console.log('  - 設定 > 時刻と言語 > 音声で音声機能を有効化');
        console.log('  - 日本語言語パックのインストール');
        return true;
    } else {
        console.error('✗ PowerShellが見つかりません');
        console.error('Windows PowerShellをインストールしてください');
        return false;
    }
}

function checkLinuxDependencies() {
    const engines = ['espeak-ng', 'espeak', 'festival', 'spd-say'];
    const available = engines.filter(cmd => isCommandAvailable(cmd));
    
    if (available.length > 0) {
        console.log(`✓ 音声エンジンが利用可能です: ${available.join(', ')}`);
        return true;
    } else {
        console.error('✗ 音声合成エンジンが見つかりません');
        console.error('以下のいずれかをインストールしてください:');
        
        const distro = detectLinuxDistribution();
        const installCommands = {
            debian: 'sudo apt-get install espeak-ng',
            redhat: 'sudo yum install espeak-ng',
            arch: 'sudo pacman -S espeak-ng',
            alpine: 'sudo apk add espeak-ng',
            unknown: 'パッケージマネージャーで espeak-ng をインストール'
        };
        
        console.error(`  ${installCommands[distro] || installCommands.unknown}`);
        return false;
    }
}

// 直接実行された場合のみチェックを実行
if (require.main === module) {
    const success = checkDependencies();
    process.exit(success ? 0 : 1);
}

module.exports = { checkDependencies };