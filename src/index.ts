import { invoke } from '@tauri-apps/api/tauri';

try {
  const input = document.querySelector<HTMLInputElement>('#command-input');
  const chatLog = document.querySelector<HTMLDivElement>('#chat-log');

  input?.addEventListener('keydown', async (event) => {
    console.log("Keydown event fired");
    if (event.key === 'Enter') {
      console.log("Enter key pressed");
      const message = input?.value;
      if (message && chatLog) {
        console.log("Sending command:", message);
        const messageElement = document.createElement('div');
        messageElement.textContent = `> ${message}`;
        chatLog.appendChild(messageElement);

        try {
          const response = await invoke<string>('execute_command', { command: message });
          console.log("Received response:", response);

          const responseElement = document.createElement('div');
          responseElement.textContent = response;
          chatLog.appendChild(responseElement);
        } catch (error) {
          console.error("Error invoking command:", error);
          const errorElement = document.createElement('div');
          errorElement.textContent = error as string;
          chatLog.appendChild(errorElement);
        }

        if(input) {
          input.value = '';
        }
      }
    }
  });
} catch (error) {
  console.error("An unexpected error occurred:", error);
  const chatLog = document.querySelector<HTMLDivElement>('#chat-log');
  if (chatLog) {
    const errorElement = document.createElement('div');
    errorElement.textContent = error instanceof Error ? error.message : String(error);
    chatLog.appendChild(errorElement);
  }
}
