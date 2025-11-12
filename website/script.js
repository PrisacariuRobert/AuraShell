// ============================================
// Typing Animation for Terminal Demo
// ============================================

const terminalCommands = [
    {
        input: "list all files in the current directory",
        output: "$ ls -la\ntotal 48\ndrwxr-xr-x  12 user  staff   384 Nov  6 10:30 .\ndrwxr-xr-x   5 user  staff   160 Nov  5 09:15 ..\n-rw-r--r--   1 user  staff  1024 Nov  6 10:30 README.md"
    },
    {
        input: "how much disk space is left?",
        output: "$ df -h\nFilesystem      Size  Used Avail Use%\n/dev/disk1     500G  320G  180G  65%"
    },
    {
        input: "show my current directory",
        output: "$ pwd\n/Users/user/Documents/GitHub/AuraShell"
    },
    {
        input: "find files modified today",
        output: "$ find . -type f -mtime -1\n./src/App.tsx\n./src-tauri/src/lib.rs"
    }
];

let currentCommandIndex = 0;
let typingSpeed = 50;
let erasingSpeed = 30;
let delayBetweenCommands = 3000;

function typeCommand() {
    const typingDemo = document.querySelector('.typing-demo');
    const terminalOutput = document.querySelector('.terminal-output');
    const currentCommand = terminalCommands[currentCommandIndex];

    if (!typingDemo || !terminalOutput) return;

    let charIndex = 0;
    typingDemo.textContent = '';
    terminalOutput.textContent = '';

    // Type input
    const typeInterval = setInterval(() => {
        if (charIndex < currentCommand.input.length) {
            typingDemo.textContent += currentCommand.input.charAt(charIndex);
            charIndex++;
        } else {
            clearInterval(typeInterval);

            // Show output after typing
            setTimeout(() => {
                terminalOutput.textContent = currentCommand.output;

                // Wait, then erase and start next command
                setTimeout(() => {
                    eraseCommand();
                }, delayBetweenCommands);
            }, 500);
        }
    }, typingSpeed);
}

function eraseCommand() {
    const typingDemo = document.querySelector('.typing-demo');
    const terminalOutput = document.querySelector('.terminal-output');

    if (!typingDemo || !terminalOutput) return;

    let currentText = typingDemo.textContent;

    const eraseInterval = setInterval(() => {
        if (currentText.length > 0) {
            currentText = currentText.slice(0, -1);
            typingDemo.textContent = currentText;
        } else {
            clearInterval(eraseInterval);
            terminalOutput.textContent = '';

            // Move to next command
            currentCommandIndex = (currentCommandIndex + 1) % terminalCommands.length;
            setTimeout(typeCommand, 500);
        }
    }, erasingSpeed);
}

// Start typing animation when page loads
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(typeCommand, 1000);
});


// ============================================
// Smooth Scroll for Navigation Links
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = targetElement.offsetTop - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});


// ============================================
// Intersection Observer for Scroll Animations
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.feature-card, .translation-card, .showcase-item, .danger-level'
    );

    animatedElements.forEach(el => {
        observer.observe(el);
    });
});


// ============================================
// Add Scroll Effect to Navigation
// ============================================

let lastScroll = 0;
const nav = document.querySelector('.nav');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        nav.style.boxShadow = '0 2px 16px rgba(0, 0, 0, 0.08)';
    } else {
        nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});


// ============================================
// Parallax Effect for Hero Section
// ============================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');

    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
        hero.style.opacity = 1 - (scrolled / 800);
    }
});


// ============================================
// Add Hover Effect to Translation Cards
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const translationCards = document.querySelectorAll('.translation-card');

    translationCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;

        card.addEventListener('mouseenter', () => {
            const arrow = card.querySelector('.translation-arrow');
            if (arrow) {
                arrow.style.transform = 'translateX(8px)';
                arrow.style.transition = 'transform 0.3s ease';
            }
        });

        card.addEventListener('mouseleave', () => {
            const arrow = card.querySelector('.translation-arrow');
            if (arrow) {
                arrow.style.transform = 'translateX(0)';
            }
        });
    });
});


// ============================================
// Feature Cards Stagger Animation
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const featureCards = document.querySelectorAll('.feature-card');

    const featureObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });

    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        featureObserver.observe(card);
    });
});


// ============================================
// Showcase Image Placeholders - Add Gradient Animation
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const showcasePlaceholders = document.querySelectorAll('.showcase-image-placeholder');

    showcasePlaceholders.forEach((placeholder, index) => {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
        ];

        placeholder.style.background = gradients[index % gradients.length];
    });
});


// ============================================
// Add Copy to Clipboard for Code Blocks
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const codeBlocks = document.querySelectorAll('.code-block, .translation-output code');

    codeBlocks.forEach(block => {
        block.style.cursor = 'pointer';
        block.title = 'Click to copy';

        block.addEventListener('click', () => {
            const text = block.textContent;

            // Copy to clipboard
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    // Show feedback
                    const originalBg = block.style.background;
                    block.style.background = '#34c759';

                    setTimeout(() => {
                        block.style.background = originalBg;
                    }, 300);
                });
            }
        });
    });
});


// ============================================
// Smooth Reveal for Danger Levels
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const dangerLevels = document.querySelectorAll('.danger-level');

    const dangerObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateX(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.2 });

    dangerLevels.forEach(level => {
        level.style.opacity = '0';
        level.style.transform = 'translateX(-30px)';
        level.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        dangerObserver.observe(level);
    });
});


// ============================================
// Add Pulsing Animation to CTA Buttons
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const primaryButtons = document.querySelectorAll('.btn-primary');

    primaryButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.animation = 'pulse 0.6s ease';
        });

        button.addEventListener('animationend', () => {
            button.style.animation = '';
        });
    });
});

// Add pulse animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);


// ============================================
// Lazy Loading for Better Performance
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
});


// ============================================
// Add Subtle Background Animation to Hero
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');

    if (hero) {
        let mouseX = 0;
        let mouseY = 0;

        hero.addEventListener('mousemove', (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 20;

            hero.style.backgroundPosition = `${50 + mouseX}% ${50 + mouseY}%`;
        });
    }
});


// ============================================
// Performance Optimization: Debounce Scroll Events
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScroll = debounce(() => {
    // Scroll-dependent operations can be added here
}, 10);

window.addEventListener('scroll', debouncedScroll);


// ============================================
// Interactive Terminal Demo
// ============================================

const commandDatabase = {
    "list all files": { cmd: "ls -la", danger: "safe" },
    "list files": { cmd: "ls -la", danger: "safe" },
    "show files": { cmd: "ls -la", danger: "safe" },
    "show disk space": { cmd: "df -h", danger: "safe" },
    "check disk usage": { cmd: "df -h", danger: "safe" },
    "disk space": { cmd: "df -h", danger: "safe" },
    "find large files": { cmd: "find . -type f -size +100M", danger: "safe" },
    "show large files": { cmd: "find . -type f -size +100M", danger: "safe" },
    "delete old logs": { cmd: "find /var/log -name '*.log' -mtime +30 -delete", danger: "high" },
    "remove old logs": { cmd: "find /var/log -name '*.log' -mtime +30 -delete", danger: "high" },
    "show current directory": { cmd: "pwd", danger: "safe" },
    "current directory": { cmd: "pwd", danger: "safe" },
    "show processes": { cmd: "ps aux", danger: "safe" },
    "list processes": { cmd: "ps aux", danger: "safe" },
    "show memory usage": { cmd: "free -h", danger: "safe" },
    "memory usage": { cmd: "free -h", danger: "safe" },
    "search for text": { cmd: "grep -r 'search_term' .", danger: "safe" },
    "find text": { cmd: "grep -r 'search_term' .", danger: "safe" },
    "create backup": { cmd: "tar -czf backup.tar.gz /path/to/files", danger: "medium" },
    "make backup": { cmd: "tar -czf backup.tar.gz /path/to/files", danger: "medium" },
    "delete everything": { cmd: "rm -rf /", danger: "high" },
    "remove all files": { cmd: "rm -rf *", danger: "high" },
};

function getDangerColor(level) {
    switch (level) {
        case "safe": return "#34c759";
        case "medium": return "#FFD60A";
        case "high": return "#FF3B30";
        default: return "#9A9A9E";
    }
}

function addInteractiveMessage(text, isUser = false, command = null, danger = null, output = null) {
    const messagesDiv = document.getElementById('interactive-messages');
    if (!messagesDiv) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'interactive-message';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    if (isUser) {
        messageDiv.innerHTML = `
            <div class="user-message">
                <div class="user-avatar"></div>
                <div class="user-message-text">${escapeHtml(text)}</div>
            </div>
        `;
    } else {
        const dangerClass = danger === "safe" ? "danger-safe" : danger === "medium" ? "danger-medium" : "danger-high";
        const outputHtml = output ? `
            <div class="command-executed-label">Command Executed</div>
            <div class="command-translation">
                <div class="command-line"><span class="demo-command-prompt" style="color: var(--aura-electric-teal);">aura$</span> ${escapeHtml(command)}</div>
            </div>
            ${output.split('\n').length > 20 ? `
                <div class="output-collapsed">
                    <div class="output-content">
                        <pre style="margin: 0; font-family: var(--font-mono); font-size: 0.875rem; color: var(--aura-success);">${escapeHtml(output.split('\n').slice(0, 10).join('\n'))}</pre>
                    </div>
                    <button class="output-expand-btn" onclick="this.parentElement.classList.toggle('output-collapsed')">Show more</button>
                </div>
            ` : `
                <pre style="margin-top: 0.5rem; margin-bottom: 0; font-family: var(--font-mono); font-size: 0.875rem; color: var(--aura-success); line-height: 1.6;">${escapeHtml(output)}</pre>
            `}
        ` : `
            <div class="command-translation">
                <div class="command-line"><span class="demo-command-prompt" style="color: var(--aura-electric-teal);">aura$</span> ${escapeHtml(command)}</div>
                <div class="command-danger-level">
                    <div class="danger-indicator ${dangerClass}"></div>
                    <span style="color: ${getDangerColor(danger)}; font-weight: 600; text-transform: capitalize;">${danger} Risk</span>
                </div>
            </div>
        `;

        messageDiv.innerHTML = `
            <div class="ai-message">
                <div class="ai-avatar">A</div>
                <div class="ai-message-content">
                    <div>
                        <span class="ai-label">Aura AI</span>
                        <span class="ai-message-timestamp">${timestamp}</span>
                    </div>
                    ${outputHtml}
                </div>
            </div>
        `;
    }

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleInteractiveCommand(userInput) {
    const input = userInput.toLowerCase().trim();

    // Add user message
    addInteractiveMessage(userInput, true);

    // Find matching command
    setTimeout(() => {
        const match = commandDatabase[input];

        if (match) {
            addInteractiveMessage("", false, match.cmd, match.danger);
        } else {
            // Try to find partial match
            const partialMatch = Object.keys(commandDatabase).find(key =>
                input.includes(key) || key.includes(input)
            );

            if (partialMatch) {
                const match = commandDatabase[partialMatch];
                addInteractiveMessage("", false, match.cmd, match.danger);
            } else {
                // Default response for unknown commands
                addInteractiveMessage("", false, "echo 'Command not recognized. Try one of the suggestions below!'", "safe");
            }
        }
    }, 500);
}

// ============================================
// Session State Management
// ============================================

let sessionStartTime = Date.now();
let commandsRunCount = 0;
let commandHistory = [];
let historyIndex = -1;
let recentCommands = [];
let pendingCommand = null;
let safetyWarningsEnabled = true;

// ============================================
// Monitoring Panel Live Updates
// ============================================

function updateNetworkIO() {
    const networkLabel = document.getElementById('network-label');
    if (!networkLabel) return;

    // Simulate network I/O (random download/upload in MB)
    const download = (Math.random() * 50).toFixed(1); // 0-50 MB
    const upload = (Math.random() * 20).toFixed(1); // 0-20 MB

    networkLabel.textContent = `↓${download} MB / ↑${upload} MB`;
}

function updateCPU() {
    const cpuProgress = document.getElementById('cpu-progress');
    const cpuLabel = document.getElementById('cpu-label');
    if (!cpuProgress || !cpuLabel) return;

    // Simulate CPU usage (random between 20-80%)
    const usage = Math.floor(Math.random() * 60) + 20;
    cpuProgress.style.width = `${usage}%`;
    cpuLabel.textContent = `${usage}%`;
}

function updateMemory() {
    const memoryProgress = document.getElementById('memory-progress');
    const memoryLabel = document.getElementById('memory-label');
    if (!memoryProgress || !memoryLabel) return;

    // Simulate memory usage (e.g., 6.4 GB / 16 GB)
    const totalGB = 16;
    const usedGB = (Math.random() * 8 + 4).toFixed(1); // Random between 4-12 GB
    const percentage = (parseFloat(usedGB) / totalGB * 100).toFixed(0);

    memoryProgress.style.width = `${percentage}%`;
    memoryLabel.textContent = `${usedGB} GB / ${totalGB} GB`;
}

function addRecentCommand(cmd) {
    recentCommands.unshift(cmd);
    if (recentCommands.length > 5) {
        recentCommands.pop();
    }

    const recentCommandsList = document.getElementById('recent-commands');
    if (!recentCommandsList) return;

    if (recentCommands.length === 0) {
        recentCommandsList.innerHTML = '<div class="recent-command-empty">No commands yet</div>';
    } else {
        recentCommandsList.innerHTML = recentCommands
            .map(cmd => `<div class="recent-command">${cmd}</div>`)
            .join('');
    }
}

// Start monitoring updates
setInterval(updateCPU, 3000);
setInterval(updateMemory, 4000);
setInterval(updateNetworkIO, 5000);

// ============================================
// Enhanced Message System
// ============================================

function addErrorMessage(errorText, suggestion) {
    const messagesDiv = document.getElementById('interactive-messages');
    if (!messagesDiv) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'interactive-message';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="ai-message">
            <div class="ai-avatar">A</div>
            <div class="ai-message-content">
                <div>
                    <span class="ai-label">Aura AI</span>
                    <span class="ai-message-timestamp">${timestamp}</span>
                </div>
                <div class="error-box" style="background: rgba(255, 100, 100, 0.1); border-left: 4px solid #ff6464; border-radius: 0.375rem; padding: 1rem; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x" style="color: #ff6464; width: 1.25rem; height: 1.25rem;"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        <strong style="color: #ff6464;">Error Detected</strong>
                    </div>
                    <div style="font-family: var(--font-mono); font-size: 0.875rem; color: var(--aura-off-white); margin-bottom: 0.75rem;">${escapeHtml(errorText)}</div>
                    <div style="font-family: var(--font-display); font-size: 0.875rem; color: var(--aura-off-white); margin-bottom: 0.75rem;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-lightbulb" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; color: var(--aura-warning);"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg><strong>Suggested Fix:</strong></div>
                    <div style="font-family: var(--font-mono); font-size: 0.875rem; background: var(--aura-deep-charcoal); padding: 0.5rem; border-radius: 0.375rem; color: var(--aura-electric-teal); margin-bottom: 0.75rem;">${escapeHtml(suggestion)}</div>
                    <div class="error-actions">
                        <button class="error-action-btn error-action-fix"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg> Run Fix</button>
                        <button class="error-action-btn error-action-ignore"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg> Ignore</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSearchResultMessage(query, results) {
    const messagesDiv = document.getElementById('interactive-messages');
    if (!messagesDiv) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'interactive-message';
    const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div class="ai-message">
            <div class="ai-avatar">A</div>
            <div class="ai-message-content">
                <div>
                    <span class="ai-label">Aura AI</span>
                    <span class="ai-message-timestamp">${timestamp}</span>
                </div>
                <div style="margin-top: 0.5rem;">
                    <div style="font-family: var(--font-display); font-size: 0.875rem; color: var(--aura-off-white); margin-bottom: 0.75rem;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; color: var(--aura-electric-teal);"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>Searched for: <strong>${escapeHtml(query)}</strong>
                    </div>
                    <div class="search-result-sources">
                        ${results.map((result, index) => `
                            <div class="search-result-source">
                                <div class="search-source-badge">${index + 1}</div>
                                <div class="search-source-content">
                                    <a href="#" class="search-source-link" onclick="return false;">
                                        ${escapeHtml(result.title)}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-right"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
                                    </a>
                                    <div class="search-source-snippet">${escapeHtml(result.source)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ============================================
// Settings Modal Handlers
// ============================================

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ============================================
// Warning Dialog Handlers
// ============================================

function showWarningDialog(command, danger) {
    return new Promise((resolve) => {
        const dialog = document.getElementById('warning-dialog');
        const commandElement = document.getElementById('warning-command');
        const cancelBtn = document.getElementById('warning-cancel-btn');
        const confirmBtn = document.getElementById('warning-confirm-btn');

        if (!dialog || !commandElement) {
            resolve(true);
            return;
        }

        commandElement.textContent = `$ ${command}`;
        dialog.classList.add('active');

        const handleCancel = () => {
            dialog.classList.remove('active');
            cancelBtn.removeEventListener('click', handleCancel);
            confirmBtn.removeEventListener('click', handleConfirm);
            resolve(false);
        };

        const handleConfirm = () => {
            dialog.classList.remove('active');
            cancelBtn.removeEventListener('click', handleCancel);
            confirmBtn.removeEventListener('click', handleConfirm);
            resolve(true);
        };

        cancelBtn.addEventListener('click', handleCancel);
        confirmBtn.addEventListener('click', handleConfirm);
    });
}

// ============================================
// Enhanced Command Handler
// ============================================

async function handleInteractiveCommand(userInput) {
    const input = userInput.toLowerCase().trim();

    // Add user message
    addInteractiveMessage(userInput, true);

    // Add to history
    commandHistory.push(userInput);
    historyIndex = commandHistory.length;

    // Find matching command
    await new Promise(resolve => setTimeout(resolve, 500));

    const match = commandDatabase[input];

    if (match) {
        // Check for dangerous commands
        if ((match.danger === "high" || match.danger === "critical") && safetyWarningsEnabled) {
            const confirmed = await showWarningDialog(match.cmd, match.danger);
            if (!confirmed) {
                // User cancelled, show cancelled message
                const messagesDiv = document.getElementById('interactive-messages');
                const messageDiv = document.createElement('div');
                messageDiv.className = 'interactive-message';
                messageDiv.innerHTML = `
                    <div class="ai-message">
                        <div class="ai-message-content">
                            <div style="font-family: var(--font-display); font-size: 0.875rem; color: var(--aura-warning); font-style: italic;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle" style="width: 1.25rem; height: 1.25rem; margin-right: 0.5rem; color: var(--aura-warning);"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>Command cancelled for safety.
                            </div>
                        </div>
                    </div>
                `;
                messagesDiv.appendChild(messageDiv);
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                return;
            }
        }

        addInteractiveMessage("", false, match.cmd, match.danger);
        addRecentCommand(match.cmd);
        commandsRunCount++;
        updateCommandsCount();

        // Simulate special responses for certain commands
        if (input.includes("error") || Math.random() < 0.2) {
            setTimeout(() => {
                addErrorMessage(
                    "Error: Package 'example-pkg' not found",
                    "Try running: npm install example-pkg"
                );
            }, 1000);
        }
    } else {
        // Try to find partial match
        const partialMatch = Object.keys(commandDatabase).find(key =>
            input.includes(key) || key.includes(input)
        );

        if (partialMatch) {
            const match = commandDatabase[partialMatch];
            addInteractiveMessage("", false, match.cmd, match.danger);
            addRecentCommand(match.cmd);
            commandsRunCount++;
            updateCommandsCount();
        } else if (input.includes("search") || input.includes("how to") || input.includes("install")) {
            // Simulate web search
            setTimeout(() => {
                addSearchResultMessage(userInput, [
                    { title: "Official Documentation", source: "docs.example.com" },
                    { title: "Stack Overflow Answer", source: "stackoverflow.com" },
                    { title: "GitHub Discussion", source: "github.com" }
                ]);
            }, 800);
        } else {
            // Default response for unknown commands
            addInteractiveMessage("", false, "echo 'Command not recognized. Try one of the suggestions below!'", "safe");
        }
    }
}

// ============================================
// Command History Navigation
// ============================================

function navigateHistory(direction) {
    const interactiveInput = document.getElementById('interactive-input');
    if (!interactiveInput || commandHistory.length === 0) return;

    if (direction === 'up') {
        if (historyIndex > 0) {
            historyIndex--;
            interactiveInput.value = commandHistory[historyIndex];
        }
    } else if (direction === 'down') {
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            interactiveInput.value = commandHistory[historyIndex];
        } else {
            historyIndex = commandHistory.length;
            interactiveInput.value = '';
        }
    }
}

// ============================================
// Toggle Monitoring Panel
// ============================================

function toggleMonitoringPanel() {
    const panel = document.getElementById('monitor-panel');
    const container = document.querySelector('.terminal-split-container');

    if (panel && container) {
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            container.style.gridTemplateColumns = '1fr 300px';
        } else {
            panel.classList.add('hidden');
            container.style.gridTemplateColumns = '1fr 0px';
        }
    }
}

// ============================================
// Clear Session
// ============================================

function clearSession() {
    const messagesDiv = document.getElementById('interactive-messages');
    if (messagesDiv) {
        messagesDiv.innerHTML = '';
    }

    commandHistory = [];
    historyIndex = -1;
    recentCommands = [];
    commandsRunCount = 0;
    sessionStartTime = Date.now();

    updateCommandsCount();
    addRecentCommand('');
    document.getElementById('recent-commands').innerHTML = '<div class="recent-command-empty">No commands yet</div>';
}

// ============================================
// Command Suggestions
// ============================================

let suggestionIndex = -1;

function showCommandSuggestions(inputText) {
    const suggestionsDiv = document.getElementById('command-suggestions');
    if (!suggestionsDiv || !inputText.trim()) {
        hideCommandSuggestions();
        return;
    }

    const matches = commandHistory
        .filter(cmd => cmd.toLowerCase().includes(inputText.toLowerCase()))
        .slice(-5)
        .reverse();

    if (matches.length === 0) {
        hideCommandSuggestions();
        return;
    }

    suggestionsDiv.innerHTML = matches
        .map((cmd, index) => `
            <div class="command-suggestion-item" data-index="${index}">${escapeHtml(cmd)}</div>
        `)
        .join('');

    suggestionsDiv.classList.add('active');
    suggestionIndex = -1;
}

function hideCommandSuggestions() {
    const suggestionsDiv = document.getElementById('command-suggestions');
    if (suggestionsDiv) {
        suggestionsDiv.classList.remove('active');
        suggestionIndex = -1;
    }
}

function selectSuggestion(direction) {
    const suggestionsDiv = document.getElementById('command-suggestions');
    if (!suggestionsDiv || !suggestionsDiv.classList.contains('active')) return;

    const items = suggestionsDiv.querySelectorAll('.command-suggestion-item');
    if (items.length === 0) return;

    // Remove previous selection
    items.forEach(item => item.classList.remove('selected'));

    // Update index
    if (direction === 'down') {
        suggestionIndex = (suggestionIndex + 1) % items.length;
    } else if (direction === 'up') {
        suggestionIndex = suggestionIndex <= 0 ? items.length - 1 : suggestionIndex - 1;
    }

    // Add new selection
    items[suggestionIndex].classList.add('selected');

    // Update input
    const input = document.getElementById('interactive-input');
    if (input && items[suggestionIndex]) {
        input.value = items[suggestionIndex].textContent;
    }
}

function acceptSuggestion() {
    const suggestionsDiv = document.getElementById('command-suggestions');
    const input = document.getElementById('interactive-input');

    if (suggestionsDiv && suggestionsDiv.classList.contains('active') && suggestionIndex >= 0) {
        const items = suggestionsDiv.querySelectorAll('.command-suggestion-item');
        if (items[suggestionIndex]) {
            input.value = items[suggestionIndex].textContent;
            hideCommandSuggestions();
            return true;
        }
    }
    return false;
}

// ============================================
// Execution Panel
// ============================================

function showExecutionPanel(commandName) {
    const panel = document.getElementById('execution-panel');
    const commandNameEl = document.getElementById('execution-command-name');
    const output = document.getElementById('execution-output');

    if (panel && commandNameEl && output) {
        commandNameEl.textContent = commandName;
        output.textContent = '';
        panel.style.display = 'flex';
        panel.classList.remove('collapsed');
    }
}

function hideExecutionPanel() {
    const panel = document.getElementById('execution-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}

function appendExecutionOutput(text) {
    const output = document.getElementById('execution-output');
    if (output) {
        output.textContent += text;
        output.scrollTop = output.scrollHeight;
    }
}

// ============================================
// Event Listeners
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const interactiveInput = document.getElementById('interactive-input');
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsCloseBtn = document.getElementById('settings-close-btn');
    const settingsOverlay = document.getElementById('settings-overlay');
    const toggleMonitorBtn = document.getElementById('toggle-monitor-btn');
    const clearSessionBtn = document.getElementById('clear-session-btn');
    const safetyToggle = document.getElementById('safety-toggle');
    const warningOverlay = document.getElementById('warning-overlay');

    // Input handlers
    if (interactiveInput) {
        // Show suggestions as user types
        interactiveInput.addEventListener('input', (e) => {
            showCommandSuggestions(e.target.value);
        });

        interactiveInput.addEventListener('keydown', (e) => {
            const suggestionsDiv = document.getElementById('command-suggestions');
            const hasSuggestions = suggestionsDiv && suggestionsDiv.classList.contains('active');

            if (e.key === 'Enter' && interactiveInput.value.trim()) {
                hideCommandSuggestions();
                handleInteractiveCommand(interactiveInput.value);
                interactiveInput.value = '';
            } else if (e.key === 'Tab' && hasSuggestions) {
                e.preventDefault();
                acceptSuggestion();
            } else if (e.key === 'ArrowUp') {
                if (hasSuggestions) {
                    e.preventDefault();
                    selectSuggestion('up');
                } else {
                    e.preventDefault();
                    navigateHistory('up');
                }
            } else if (e.key === 'ArrowDown') {
                if (hasSuggestions) {
                    e.preventDefault();
                    selectSuggestion('down');
                } else {
                    e.preventDefault();
                    navigateHistory('down');
                }
            } else if (e.key === 'Escape') {
                hideCommandSuggestions();
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!interactiveInput.contains(e.target)) {
                hideCommandSuggestions();
            }
        });
    }

    // Suggestion buttons
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const command = btn.dataset.command;
            if (interactiveInput && command) {
                interactiveInput.value = command;
                handleInteractiveCommand(command);
                interactiveInput.value = '';
            }
        });
    });

    // Settings modal
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsModal);
    }
    if (settingsCloseBtn) {
        settingsCloseBtn.addEventListener('click', closeSettingsModal);
    }
    if (settingsOverlay) {
        settingsOverlay.addEventListener('click', closeSettingsModal);
    }

    // Toggle monitoring panel
    if (toggleMonitorBtn) {
        toggleMonitorBtn.addEventListener('click', toggleMonitoringPanel);
    }

    // Clear session
    if (clearSessionBtn) {
        clearSessionBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the session?')) {
                clearSession();
            }
        });
    }

    // Safety toggle
    if (safetyToggle) {
        safetyToggle.addEventListener('change', (e) => {
            safetyWarningsEnabled = e.target.checked;
        });
    }

    // Close warning dialog overlay
    if (warningOverlay) {
        warningOverlay.addEventListener('click', () => {
            const dialog = document.getElementById('warning-dialog');
            if (dialog) {
                dialog.classList.remove('active');
            }
        });
    }

    // Execution panel controls
    const collapseBtn = document.getElementById('execution-collapse');
    const stopBtn = document.getElementById('execution-stop');

    if (collapseBtn) {
        collapseBtn.addEventListener('click', () => {
            const panel = document.getElementById('execution-panel');
            if (panel) {
                panel.classList.toggle('collapsed');
                collapseBtn.innerHTML = panel.classList.contains('collapsed') ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>';
            }
        });
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            hideExecutionPanel();
        });
    }

    // Initialize monitoring
    updateCPU();
    updateMemory();
    updateNetworkIO();
});


// ============================================
// Animated Demo Video
// ============================================

let demoPlaying = false;
let demoCurrentScene = 1;
let demoTotalScenes = 7;
let demoSceneDuration = 5000; // 5 seconds per scene
let demoTotalDuration = demoTotalScenes * demoSceneDuration; // 35 seconds total
let demoStartTime = 0;
let demoAnimationFrame = null;
let demoInterval = null;

function playDemo() {
    demoPlaying = true;
    demoStartTime = Date.now();

    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    if (playIcon && pauseIcon) {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }

    // Start scene rotation
    demoInterval = setInterval(() => {
        if (demoCurrentScene < demoTotalScenes) {
            demoCurrentScene++;
            showDemoScene(demoCurrentScene);
        } else {
            // Loop back to start
            demoCurrentScene = 1;
            demoStartTime = Date.now();
            showDemoScene(1);
        }
    }, demoSceneDuration);

    // Start progress bar animation
    animateDemoProgress();
}

function pauseDemo() {
    demoPlaying = false;

    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    if (playIcon && pauseIcon) {
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    }

    if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
    }

    if (demoAnimationFrame) {
        cancelAnimationFrame(demoAnimationFrame);
        demoAnimationFrame = null;
    }
}

function showDemoScene(sceneNumber) {
    // Hide all scenes
    for (let i = 1; i <= demoTotalScenes; i++) {
        const scene = document.getElementById(`scene-${i}`);
        if (scene) {
            scene.classList.remove('active');
        }
    }

    // Show current scene
    const currentScene = document.getElementById(`scene-${sceneNumber}`);
    if (currentScene) {
        currentScene.classList.add('active');
    }

    // Update scene indicator
    const sceneNumberElement = document.querySelector('.scene-number');
    if (sceneNumberElement) {
        sceneNumberElement.textContent = sceneNumber;
    }
}

function toggleDemoPlayPause() {
    if (demoPlaying) {
        pauseDemo();
    } else {
        playDemo();
    }
}

// Initialize demo video on scroll into view
const demoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !demoPlaying) {
            // Auto-play when demo comes into view
            setTimeout(() => {
                playDemo();
            }, 500);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const demoSection = document.querySelector('.demo-video-section');
    if (demoSection) {
        demoObserver.observe(demoSection);
    }

    const playPauseBtn = document.getElementById('demo-play-pause');
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', toggleDemoPlayPause);
    }

    const progressTrack = document.querySelector('.demo-progress-track');
    if (progressTrack) {
        progressTrack.addEventListener('click', (e) => {
            const rect = progressTrack.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percent = clickX / rect.width;
            const targetTime = percent * demoTotalDuration;
            const targetScene = Math.ceil(targetTime / demoSceneDuration);

            demoCurrentScene = Math.max(1, Math.min(targetScene, demoTotalScenes));
            demoStartTime = Date.now() - ((demoCurrentScene - 1) * demoSceneDuration);

            showDemoScene(demoCurrentScene);

            if (demoPlaying) {
                clearInterval(demoInterval);
                demoInterval = setInterval(() => {
                    if (demoCurrentScene < demoTotalScenes) {
                        demoCurrentScene++;
                        showDemoScene(demoCurrentScene);
                    } else {
                        demoCurrentScene = 1;
                        demoStartTime = Date.now();
                        showDemoScene(1);
                    }
                }, demoSceneDuration);
            }
        });
    }
});


// ============================================
// Showcase Stacked Cards Scroll Animation
// ============================================

function initShowcaseStackedCards() {
    const stackContainer = document.getElementById('showcase-stack');
    if (!stackContainer) return;

    const cards = document.querySelectorAll('.showcase-card');
    const paginationDots = document.querySelectorAll('.pagination-dot');
    let currentCardIndex = 0;

    function updateCards() {
        const containerRect = stackContainer.getBoundingClientRect();
        const containerHeight = stackContainer.offsetHeight;
        const windowHeight = window.innerHeight;

        // Calculate scroll progress through the container
        // Use linear scroll for consistent speed throughout all cards
        const scrollProgress = Math.max(0, -containerRect.top) / (containerHeight - windowHeight);

        // Number of cards
        const cardCount = cards.length;

        // Add delay effect using easing function
        // This creates a pause at each card position (0, 0.25, 0.5, 0.75, 1.0)
        function easeInOutWithDelay(x) {
            const delayAmount = 0.25; // 25% pause, 75% transition for smooth scrolling
            const transitionAmount = 1 - delayAmount;

            // Map progress to include delays
            const sectionSize = 1 / cardCount;
            const currentSection = Math.floor(x / sectionSize);
            const progressInSection = (x % sectionSize) / sectionSize;

            // Apply delay: first 30% of section = no movement, last 70% = smooth transition
            let easedProgress;
            if (progressInSection < delayAmount) {
                easedProgress = 0; // Hold at current card
            } else {
                const transitionProgress = (progressInSection - delayAmount) / transitionAmount;
                easedProgress = transitionProgress; // Smooth transition to next
            }

            return currentSection + easedProgress;
        }

        const easedScrollProgress = easeInOutWithDelay(scrollProgress);
        const cardProgress = easedScrollProgress * cardCount;
        const activeIndex = Math.min(Math.floor(cardProgress), cardCount - 1);

        // Check if we've reached the last card
        const isLastCardActive = activeIndex >= cardCount - 1;

        // Update pagination dots
        paginationDots.forEach((dot, index) => {
            if (index === activeIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        cards.forEach((card, index) => {
            const cardNumber = parseInt(card.dataset.card);

            // Keep last card visible and stationary once we've scrolled to it
            if (isLastCardActive && cardNumber === cardCount) {
                card.classList.remove('exiting');
                card.style.transform = 'translateX(-50%) scale(1) translateY(0)';
                card.style.opacity = '1';
                card.style.zIndex = cardCount;
            } else if (cardNumber - 1 < activeIndex) {
                // Cards that have been scrolled past - exit upward
                card.classList.add('exiting');
                card.style.transform = 'translateX(-50%) scale(0.85) translateY(-100px)';
                card.style.opacity = '0';
            } else if (cardNumber - 1 === activeIndex) {
                // Current active card
                card.classList.remove('exiting');
                const localProgress = cardProgress - activeIndex;

                // For the last card, don't let it exit
                if (cardNumber === cardCount) {
                    card.style.transform = 'translateX(-50%) scale(1) translateY(0)';
                    card.style.opacity = '1';
                } else {
                    // Smooth transition as it exits
                    const scale = 1 - (localProgress * 0.15);
                    const translateY = -(localProgress * 100);
                    const opacity = 1 - (localProgress * 1);

                    card.style.transform = `translateX(-50%) scale(${scale}) translateY(${translateY}px)`;
                    card.style.opacity = opacity;
                }
                card.style.zIndex = cardCount - index;
            } else if (cardNumber - 1 === activeIndex + 1) {
                // Next card - scale up from behind
                card.classList.remove('exiting');
                const localProgress = cardProgress - activeIndex;
                const scale = 0.95 + (localProgress * 0.05);
                const translateY = 20 - (localProgress * 20);

                card.style.transform = `translateX(-50%) scale(${scale}) translateY(${translateY}px)`;
                card.style.opacity = '1';
                card.style.zIndex = cardCount - index;
            } else if (cardNumber - 1 === activeIndex + 2) {
                // Third card - behind the second
                card.classList.remove('exiting');
                card.style.transform = 'translateX(-50%) scale(0.9) translateY(40px)';
                card.style.opacity = '1';
                card.style.zIndex = cardCount - index;
            } else {
                // Cards further back
                card.classList.remove('exiting');
                card.style.transform = 'translateX(-50%) scale(0.85) translateY(60px)';
                card.style.opacity = '0';
                card.style.zIndex = cardCount - index;
            }
        });
    }

    // Throttle scroll events for better performance
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                updateCards();
                ticking = false;
            });
            ticking = true;
        }
    });

    // Initial update
    updateCards();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initShowcaseStackedCards();
});

// ============================================
// Console Easter Egg
// ============================================

console.log('%cAuraShell <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rocket"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.3.09-3.1a2 2 0 0 0-2.43-2.43c-.81.61-2.27.62-3.1.09z"/><path d="m12 15-3-3a6 6 0 0 1 3-10.5c1.72 0 3.26.86 4.21 2.21l.42.58a2 2 0 0 1 .04 2.12l-3.1 3.1a6 6 0 0 1-10.5 3z"/><path d="m14 12.5 3 3"/><path d="M20.5 10.5c.3-.3.5-.8.5-1.25a2.5 2.5 0 0 0-4.25-1.75"/></svg>', 'font-size: 24px; font-weight: bold; color: #00F5D4;');
console.log('%cYour terminal speaks your language.', 'font-size: 14px; color: #9A9A9E;');
console.log('%cInterested in contributing? Check out: https://github.com/PrisacariuRobert/AuraShell', 'font-size: 12px; color: #00F5D4;');

// ============================================
// OS Detection & Download Links
// ============================================

function detectOS() {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();

    // Detect macOS
    if (platform.includes('mac')) {
        // Check if Apple Silicon or Intel
        // Modern Macs with Apple Silicon report as "MacIntel" but we can't reliably detect M1/M2/M3
        // Default to Apple Silicon as it's newer
        return { os: 'macos', arch: 'aarch64' };
    }

    // Detect Linux
    if (platform.includes('linux') || userAgent.includes('linux')) {
        return { os: 'linux', arch: 'x64' };
    }

    // Detect Windows (fallback to macOS if unknown)
    if (platform.includes('win') || userAgent.includes('windows')) {
        return { os: 'windows', arch: 'x64' };
    }

    // Default to macOS Apple Silicon
    return { os: 'macos', arch: 'aarch64' };
}

function setupDownloadButtons() {
    const detected = detectOS();
    const primaryBtn = document.getElementById('primary-download-btn');
    const primaryText = document.getElementById('primary-download-text');
    const heroBtn = document.getElementById('hero-download-btn');

    if (!primaryBtn || !primaryText) return;

    let downloadUrl = '';
    let buttonText = '';

    if (detected.os === 'macos') {
        if (detected.arch === 'aarch64') {
            downloadUrl = 'https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_aarch64.dmg';
            buttonText = 'Download for macOS (Apple Silicon)';
        } else {
            downloadUrl = 'https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_x64.dmg';
            buttonText = 'Download for macOS (Intel)';
        }
    } else if (detected.os === 'linux') {
        downloadUrl = 'https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_amd64.deb';
        buttonText = 'Download for Linux';
    } else if (detected.os === 'windows') {
        downloadUrl = 'https://github.com/PrisacariuRobert/AuraShell/releases/latest/download/AuraShell_0.1.0_x64_en-US.msi';
        buttonText = 'Download for Windows';
    }

    primaryText.textContent = buttonText;
    primaryBtn.onclick = () => {
        window.location.href = downloadUrl;
    };

    if (heroBtn) {
        if (detected.os === 'macos') {
            heroBtn.textContent = 'Download for Mac';
        } else if (detected.os === 'linux') {
            heroBtn.textContent = 'Download for Linux';
        } else if (detected.os === 'windows') {
            heroBtn.textContent = 'Download for Windows';
        }
        heroBtn.href = downloadUrl;
    }
}

// Initialize download buttons on page load
document.addEventListener('DOMContentLoaded', setupDownloadButtons);
