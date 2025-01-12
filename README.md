# One-Click-Allure-to-Pytest-Path
Hook Allure's "Copy to clipboard" functionality to transform the copied content.
## 引言

在使用 **Allure** 生成测试报告时，我们经常会遇到一个痛点：**从 Allure 报告中复制的 Case 路径无法直接用于 Pytest 运行**。具体表现为：

1. **路径格式不兼容**：

   - Allure 报告中的 Case 路径通常是以模块名、类名和方法名拼接而成的字符串，例如：

     ```
     tests/test_example.py::TestExample::test_case
     ```

   - 这种路径格式虽然清晰，但直接复制后无法直接在 Pytest 命令行中使用，因为 Pytest 需要的是文件路径和测试函数的层级关系。

2. **缺少文件路径信息**：

   - Allure 报告中的路径通常只包含模块名和方法名，缺少完整的文件路径信息。例如：

     ```
     test_example.py::TestExample::test_case
     ```

   - 如果项目结构复杂，或者存在同名模块，直接使用这种路径可能会导致 Pytest 无法正确找到测试用例。

3. **手动修改路径的麻烦**：

   - 为了运行特定的测试用例，用户需要手动将 Allure 报告中的路径修改为 Pytest 可识别的格式。例如：

     ```
     tests.test_example.TestExample::test_case
     ```

     需要手动修改为：

     ```
     tests/test_example.py::TestExample::test_case
     ```

   - 这种手动操作不仅繁琐，还容易出错。

4. **影响效率**：

   - 在大型项目中，测试用例数量庞大，频繁手动修改路径会显著降低开发和测试效率。

------

## 解决方案：使用油猴脚本开发自定义插件

为了解决上述痛点，可以通过开发一个 **油猴脚本（Tampermonkey）** 来自动化处理 Allure 报告中的 Case 路径，使其可以直接用于 Pytest 运行。

### 油猴脚本的功能设计

1. **自动提取 Case 路径**：
   - 从 Allure 报告中提取测试用例的完整路径。
   - 将路径格式转换为 Pytest 可识别的格式。
2. **一键复制路径**：
   - 在 Allure 报告页面中添加一个“复制路径”按钮。
   - 点击按钮后，自动将转换后的路径复制到剪贴板。
3. **支持多种路径格式**：
   - 支持处理不同格式的 Allure 报告路径。
   - 确保生成的路径兼容 Pytest。
4. **用户友好**：
   - 提供清晰的提示信息，方便用户操作。
   - 支持自定义配置，满足不同项目的需求。

------

## 油猴脚本的实现

以下是一个简单的油猴脚本示例，用于实现上述功能：

```javascript
// ==UserScript==
// @name         Allure Copy Hook
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

```

------

## 油猴脚本的安装与使用

### 安装步骤

1. **安装油猴插件**：

   - 打开浏览器（如 Chrome、Firefox）。

   - 访问 [Tampermonkey 官网]()。

   - ```
     https://www.tampermonkey.net/
     ```

   - 下载并安装适合你浏览器的油猴插件。

2. **创建新脚本**：

   - 点击浏览器右上角的油猴图标。
   - 选择“创建新脚本”。

3. **粘贴脚本代码**：

   - 将上述油猴脚本代码粘贴到编辑器中。
   - 修改 `@match` 字段，确保脚本适用于你的 Allure 报告地址。

4. **保存脚本**：

   - 点击“文件” -> “保存”。
   - 脚本会自动生效。

### 使用方法

1. **打开 Allure 报告**：

   - 访问你的 Allure 报告页面。

2. **复制路径**：

   - 在测试用例标题旁边会显示“复制路径”按钮。
   - 点击按钮，路径会自动复制到剪贴板。

3. **运行测试用例**：

   - 打开终端或命令行工具。

   - 粘贴复制的路径并运行 Pytest 命令。例如：

     ```
     pytest tests/test_example.py::TestExample::test_case
     ```

------

## 总结

通过开发油猴脚本，我们可以有效解决 Allure 报告中 Case 路径无法直接被 Pytest 使用的痛点。该脚本不仅简化了路径转换和复制的操作，还提升了开发和测试的效率。以下是本文的核心要点：

1. **痛点分析**：
   - Allure 报告中的 Case 路径格式与 Pytest 不兼容。
   - 手动修改路径繁琐且容易出错。
2. **解决方案**：
   - 使用油猴脚本自动化处理路径转换。
   - 添加“复制路径”按钮，支持一键复制。
3. **油猴脚本实现**：
   - 提取 Allure 报告中的路径并转换为 Pytest 格式。
   - 使用 `fallbackWriteToClipboard` 实现剪贴板功能。
4. **安装与使用**：
   - 安装油猴插件并创建新脚本。
   - 在 Allure 报告页面中点击按钮复制路径。

希望本文的解决方案能帮助你更高效地使用 Allure 和 Pytest！如果有任何问题或建议，欢迎留言讨论。
