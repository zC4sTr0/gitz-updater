const fs = require('fs');
const https = require('https');
const blake = require('blakejs');
const { dialog } = require('electron');

// A URL do servidor de onde o arquivo de atualização pode ser baixado
const versionInfoUrl = 'https://seuserver.com/atualizacoes/latest.json';

// Função para calcular o hash BLAKE2b de um arquivo
function calculateHash(filePath) {
    try {
        const data = fs.readFileSync(filePath);
        return blake.blake2bHex(data);
    } catch (err) {
        console.error(`Erro ao calcular hash para ${filePath}: ${err}`);
        return null;
    }
}

// Função para baixar o arquivo de informações da versão
function downloadVersionInfo(url, callback) {
    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        res.on('end', () => {
            callback(null, JSON.parse(data));
        });
    }).on('error', (err) => {
        callback(err, null);
    });
}

// Função para verificar a integridade dos arquivos
function verifyFileIntegrity(versionInfo, gameDir) {
    let allFilesValid = true;

    versionInfo.files.forEach(file => {
        const localFilePath = `${gameDir}/${file.name}`;
        const localFileHash = calculateHash(localFilePath);
        
        if (localFileHash !== file.hash) {
            allFilesValid = false;
            console.error(`Hash mismatch! File: ${file.name}, Expected: ${file.hash}, Found: ${localFileHash}`);
            dialog.showErrorBox('Erro de Verificação', `A integridade do arquivo não pode ser verificada: ${file.name}`);
        }
    });

    return allFilesValid;
}

// Você pode chamar essa função para iniciar o processo de atualização
function checkForUpdates(gameDir) {
    downloadVersionInfo(versionInfoUrl, (err, versionInfo) => {
        if (err) {
            console.error('Erro ao baixar informações de versão:', err);
            return;
        }

        if (verifyFileIntegrity(versionInfo, gameDir)) {
            console.log('Todos os arquivos estão íntegros.');
            // Seus arquivos estão atualizados ou o processo de atualização foi concluído com sucesso
        } else {
            console.error('Falha na verificação de integridade dos arquivos.');
            // O processo de atualização falhou ou os arquivos estão corrompidos
        }
    });
}

module.exports = { checkForUpdates };
