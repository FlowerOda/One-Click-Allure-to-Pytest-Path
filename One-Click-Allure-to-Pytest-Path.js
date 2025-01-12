// ==UserScript==
// @name         One-Click-Allure-to-Pytest-Path
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Hook Allure's "Copy to clipboard" functionality to transform the copied content.[编程拾光]
// @match       *://*/*
// @grant       none
// ==/UserScript==

function fallbackWriteToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    textarea.select();
    try {
        const success = document.execCommand('copy');
        if (success) {
            console.log('Fallback: Text copied to clipboard successfully!');
        } else {
            console.error('Fallback: Failed to copy text.');
        }
    } catch (err) {
        console.error('Fallback: Exception occurred while copying text:', err);
    }
    document.body.removeChild(textarea);
}


/**
     * 解析 Allure 路径并转换为 Pytest 格式
     * @param {string} allurePath - 原始的 Allure 路径
     * @returns {string} - 转换后的 Pytest 路径
*/
function convertAllurePathToPytest(allurePath) {
    // 分割路径，获取类名和方法
    const [moduleClass, method] = allurePath.split("#");

    // 将模块类名的点替换为斜杠，构造文件路径
    const moduleParts = moduleClass.split(".");

    // 提取类名，类名是模块路径的最后一部分
    const className = moduleParts.pop(); // 获取类名
    const modulePath = moduleParts.join("/");// 获取模块路径，替换为斜杠分隔
    let filePath = modulePath+ ".py";

    // 构造 pytest 格式的路径
    const pytestPath = `${filePath}::${className}::${method}`;
    console.log(`解析后的路径: ${pytestPath}`);
    return pytestPath;
}

(function () {
    'use strict';
    console.log('Tampermonkey script loaded.');
    // 监听点击事件
    document.body.addEventListener('click', function (event) {
        // 确认是否点击了包含 `data-copy` 属性的元素
        const targetSpan = event.target.closest('span[data-copy]');
        if (targetSpan) {
            console.log('Target element clicked:', targetSpan);
            // 获取 `data-copy` 属性内容
            const copyText = targetSpan.getAttribute('data-copy');
            console.log('Original data-copy value:', copyText);
            const transformedText=convertAllurePathToPytest(copyText);
            // 写入剪贴板
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(transformedText)
                    .then(() => {
                    console.log('Transformed text written to clipboard.');
                })
                    .catch((err) => {
                    console.error('Failed to write to clipboard, falling back.', err);
                    fallbackWriteToClipboard(transformedText);
                });
            } else {
                console.log('Clipboard API not supported, using fallback.');
                fallbackWriteToClipboard(transformedText);
            }
        }
    });
})();
