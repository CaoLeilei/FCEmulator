/**
 * 消息显示工具
 */

export function showMessage(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info'): void {
  const container = document.getElementById('message-container');
  if (!container) return;

  const messageElement = document.createElement('div');
  messageElement.className = `message message-${type}`;
  messageElement.textContent = message;
  
  container.appendChild(messageElement);
  
  // 3秒后自动移除
  setTimeout(() => {
    if (container.contains(messageElement)) {
      container.removeChild(messageElement);
    }
  }, 3000);
}

export function clearMessages(): void {
  const container = document.getElementById('message-container');
  if (container) {
    container.innerHTML = '';
  }
}