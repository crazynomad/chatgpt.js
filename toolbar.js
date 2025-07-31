// ==UserScript==
// @name         ChatGPT Custom Toolbar
// @namespace    https://github.com/KudoAI/chatgpt.js
// @version      1.0.0
// @description  在ChatGPT回答下方添加自定义工具栏图标
// @author       ChatGPT.js Community
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @icon         https://assets.chatgptjs.org/images/icons/platforms/chatgpt/black-on-white/icon50.png
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 配置选项
    const CONFIG = {
        debug: true, // 调试模式
        icons: [
            {
                name: '收藏',
                title: '收藏这个回答',
                svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
                </svg>`,
                handler: handleFavorite
            },
            {
                name: '复制代码',
                title: '复制回答中的所有代码块',
                svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>`,
                handler: handleCopyCode
            },
            {
                name: '导出',
                title: '导出回答为Markdown格式',
                svg: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14,2 14,8 20,8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10,9 9,9 8,9"></polyline>
                </svg>`,
                handler: handleExportMarkdown
            }
        ]
    };

    // 工具函数
    function log(...args) {
        if (CONFIG.debug) {
            console.log('[ChatGPT Toolbar]', ...args);
        }
    }

    function showNotification(message, type = 'info') {
        // 创建简单的通知
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 图标处理函数
    function handleFavorite(replyDiv, messageIndex) {
        const replyText = getReplyText(replyDiv);
        log('收藏回答:', messageIndex + 1, replyText.substring(0, 100) + '...');
        
        // 存储到localStorage
        const favorites = JSON.parse(localStorage.getItem('chatgpt_favorites') || '[]');
        const favorite = {
            id: Date.now(),
            text: replyText,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        favorites.push(favorite);
        localStorage.setItem('chatgpt_favorites', JSON.stringify(favorites));
        
        showNotification('✨ 回答已收藏到本地存储', 'success');
    }

    function handleCopyCode(replyDiv, messageIndex) {
        const codeBlocks = replyDiv.querySelectorAll('pre code, code');
        if (codeBlocks.length === 0) {
            showNotification('❌ 此回答中没有找到代码块', 'error');
            return;
        }

        let allCode = '';
        codeBlocks.forEach((block, index) => {
            const language = block.className.match(/language-(\w+)/)?.[1] || 'text';
            allCode += `\`\`\`${language}\n${block.textContent}\n\`\`\`\n\n`;
        });

        copyToClipboard(allCode.trim()).then(() => {
            showNotification(`📋 已复制 ${codeBlocks.length} 个代码块`, 'success');
        }).catch(() => {
            showNotification('❌ 复制失败，请手动复制', 'error');
        });
    }

    function handleExportMarkdown(replyDiv, messageIndex) {
        const replyText = getReplyText(replyDiv);
        const markdown = convertToMarkdown(replyDiv);
        const timestamp = new Date().toLocaleString('zh-CN');
        
        const content = `# ChatGPT 回答导出

**导出时间**: ${timestamp}  
**回答序号**: ${messageIndex + 1}  
**页面链接**: ${window.location.href}

---

${markdown}
`;

        downloadFile(`chatgpt-answer-${messageIndex + 1}-${Date.now()}.md`, content);
        showNotification('📄 Markdown文件已下载', 'success');
    }

    // 辅助函数
    function getReplyText(replyDiv) {
        // 克隆节点以避免影响原始DOM
        const clone = replyDiv.cloneNode(true);
        
        // 移除可能的按钮和工具栏
        const buttons = clone.querySelectorAll('button, .custom-toolbar');
        buttons.forEach(btn => btn.remove());
        
        return clone.textContent.trim();
    }

    function convertToMarkdown(replyDiv) {
        // 简单的HTML到Markdown转换
        const clone = replyDiv.cloneNode(true);
        
        // 移除工具栏
        const toolbars = clone.querySelectorAll('.custom-toolbar, button');
        toolbars.forEach(toolbar => toolbar.remove());
        
        let markdown = clone.innerHTML;
        
        // 转换代码块
        markdown = markdown.replace(/<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g, '```$1\n$2\n```');
        markdown = markdown.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '```\n$1\n```');
        markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');
        
        // 转换其他HTML标签
        markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
        markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');
        markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
        markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');
        markdown = markdown.replace(/<h(\d)>(.*?)<\/h\1>/g, (match, level, text) => '#'.repeat(parseInt(level)) + ' ' + text);
        
        // 清理HTML标签
        markdown = markdown.replace(/<[^>]*>/g, '');
        
        // 清理多余的空行
        markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        return markdown.trim();
    }

    async function copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // 降级方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (!successful) throw new Error('Copy command failed');
            } catch (err) {
                document.body.removeChild(textArea);
                throw err;
            }
        }
    }

    function downloadFile(filename, content) {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // 主要功能函数
    function addCustomToolbar() {
        const replyDivs = document.querySelectorAll('div[data-message-author-role="assistant"]');
        log(`找到 ${replyDivs.length} 个回答`);
        
        replyDivs.forEach((replyDiv, index) => {
            // 检查是否已经添加过工具栏
            if (replyDiv.querySelector('.custom-toolbar')) {
                return;
            }
            
            // 创建工具栏容器
            const toolbar = document.createElement('div');
            toolbar.className = 'custom-toolbar';
            toolbar.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
                padding: 8px 0;
                border-top: 1px solid rgba(0,0,0,0.1);
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            
            // 添加图标按钮
            CONFIG.icons.forEach(iconConfig => {
                const button = createToolbarButton(iconConfig, replyDiv, index);
                toolbar.appendChild(button);
            });
            
            // 添加到回答末尾
            replyDiv.appendChild(toolbar);
            
            // 鼠标悬停显示工具栏
            replyDiv.addEventListener('mouseenter', () => {
                toolbar.style.opacity = '1';
            });
            
            replyDiv.addEventListener('mouseleave', () => {
                toolbar.style.opacity = '0.3';
            });
            
            // 初始设置为半透明
            setTimeout(() => {
                toolbar.style.opacity = '0.3';
            }, 100);
        });
    }

    function createToolbarButton(iconConfig, replyDiv, messageIndex) {
        const button = document.createElement('button');
        button.className = 'custom-toolbar-btn';
        button.title = iconConfig.title;
        button.innerHTML = iconConfig.svg;
        
        button.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            color: #666;
            transition: all 0.2s ease;
            padding: 0;
        `;
        
        // 鼠标悬停效果
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0,0,0,0.05)';
            button.style.color = '#000';
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'transparent';
            button.style.color = '#666';
            button.style.transform = 'scale(1)';
        });
        
        // 点击事件
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                iconConfig.handler(replyDiv, messageIndex);
            } catch (error) {
                log('按钮点击处理出错:', error);
                showNotification('❌ 操作失败', 'error');
            }
        });
        
        return button;
    }

    // 暗色主题支持
    function updateTheme() {
        const isDark = document.documentElement.classList.contains('dark') || 
                      document.documentElement.getAttribute('data-theme') === 'dark';
        
        const buttons = document.querySelectorAll('.custom-toolbar-btn');
        buttons.forEach(button => {
            if (isDark) {
                button.style.color = '#aaa';
                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    button.style.color = '#fff';
                });
            } else {
                button.style.color = '#666';
                button.addEventListener('mouseenter', () => {
                    button.style.backgroundColor = 'rgba(0,0,0,0.05)';
                    button.style.color = '#000';
                });
            }
        });
    }

    // 等待页面加载
    function waitForChatGPTLoaded() {
        return new Promise((resolve) => {
            if (document.querySelector('div[data-message-author-role="assistant"]')) {
                resolve();
            } else {
                const observer = new MutationObserver((mutations, obs) => {
                    if (document.querySelector('div[data-message-author-role="assistant"]')) {
                        obs.disconnect();
                        resolve();
                    }
                });
                observer.observe(document.body, { childList: true, subtree: true });
            }
        });
    }

    // 监听新回答
    function initObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // 检查是否有新的回答
                    const hasNewReply = Array.from(mutation.addedNodes).some(node => 
                        node.nodeType === Node.ELEMENT_NODE && (
                            node.matches && node.matches('div[data-message-author-role="assistant"]') ||
                            node.querySelector && node.querySelector('div[data-message-author-role="assistant"]')
                        )
                    );
                    
                    if (hasNewReply) {
                        shouldUpdate = true;
                    }
                }
            });
            
            if (shouldUpdate) {
                setTimeout(() => {
                    addCustomToolbar();
                    updateTheme();
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        log('DOM变化监听器已启动');
    }

    // 主初始化函数
    async function init() {
        try {
            log('开始初始化自定义工具栏...');
            
            // 等待ChatGPT加载
            await waitForChatGPTLoaded();
            log('ChatGPT页面加载完成');
            
            // 初始添加工具栏
            addCustomToolbar();
            updateTheme();
            
            // 启动监听器
            initObserver();
            
            // 监听主题变化
            const themeObserver = new MutationObserver(() => {
                updateTheme();
            });
            themeObserver.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['class', 'data-theme']
            });
            
            log('✅ 自定义工具栏初始化完成');
            showNotification('🔧 ChatGPT自定义工具栏已加载', 'success');
            
        } catch (error) {
            log('❌ 初始化失败:', error);
            showNotification('❌ 工具栏加载失败', 'error');
        }
    }

    // 页面加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // 导出到全局作用域（用于调试）
    window.ChatGPTToolbar = {
        addCustomToolbar,
        updateTheme,
        CONFIG,
        log
    };

})();