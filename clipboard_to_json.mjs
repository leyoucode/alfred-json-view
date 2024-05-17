import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import open from 'open';

const app = express();
const MIN_PORT = 8000;
const MAX_PORT = 9000;
const SERVER_RUNNING_TIME = 2 * 1000;  // 服务器运行时间（毫秒）

// 获取剪切板内容
function getClipboardContent() {
    return execSync('pbpaste').toString();
}

// 将内容写入临时 JSON 文件
function writeToTempJson(content) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'json-'));
    const tempFilePath = path.join(tempDir, 'temp.json');
    fs.writeFileSync(tempFilePath, content);
		console.log(tempFilePath);
    return tempFilePath;
}

// 设置路由
app.get('/temp.json', (req, res) => {
    const content = getClipboardContent();
    const tempFilePath = writeToTempJson(content);

    res.sendFile(tempFilePath, {
        headers: {
            'Content-Type': 'application/json'
        }
    }, (err) => {
        if (err) {
            console.log(err);
            res.status(500).send('Error serving the file');
        } else {
            // 删除临时文件和目录
            fs.unlinkSync(tempFilePath);
            fs.rmdirSync(path.dirname(tempFilePath));
        }
    });
});

// 启动服务器并在浏览器中打开 URL
function startServer() {
    const port = Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT;

    const server = app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/temp.json`);
        open(`http://localhost:${port}/temp.json`);

        // 设置定时器，在指定时间后关闭服务器
        setTimeout(() => {
            server.close(() => {
                console.log('Server closed');
            });
        }, SERVER_RUNNING_TIME);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} in use, retrying...`);
            startServer();  // 重试启动服务器
        } else {
            console.error(`Server error: ${err}`);
        }
    });
}

startServer();

