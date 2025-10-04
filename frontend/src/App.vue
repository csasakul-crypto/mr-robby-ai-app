<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const conversations = ref([]);
const userMessage = ref(''); // 1. ตัวแปรสำหรับเก็บข้อความที่ user พิมพ์
const status = ref('Loading history...');
const isLoading = ref(false);

// 2. เปลี่ยน URL เป็น endpoint ใหม่สำหรับแชท
const CHAT_API_URL = 'http://localhost:3000/api/chat'; 
const HISTORY_API_URL = 'http://localhost:3000/api/conversations';

async function fetchConversations() {
  // ... (โค้ดส่วนนี้เหมือนเดิม)
  try {
    const response = await axios.get(HISTORY_API_URL);
    conversations.value = response.data;
    status.value = 'Ready to talk.';
  } catch (error) {
    console.error('Error fetching conversations:', error);
    status.value = 'Could not load history.';
  }
}

// 3. อัปเดตฟังก์ชันการส่งข้อความ
async function sendMessage() {
  if (!userMessage.value.trim()) return; // ไม่ส่งถ้าเป็นข้อความว่าง

  isLoading.value = true;
  status.value = 'AI is thinking...';

  try {
    // 4. ส่งเฉพาะข้อความของ user ไปที่ /api/chat
    await axios.post(CHAT_API_URL, {
      message: userMessage.value 
    });

    userMessage.value = ''; // 5. ล้างช่อง input
    await fetchConversations(); // 6. ดึงประวัติล่าสุดทั้งหมด (ซึ่งจะรวมคำตอบใหม่ไว้ด้วย)

  } catch (error) {
    console.error('Error sending message:', error);
    status.value = 'Failed to get a response from AI.';
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchConversations();
});
</script>

<template>
  <main class="main-container">
    <div class="history-box">
      <h3>Conversation History</h3>
      <ul v-if="conversations.length > 0">
        <li v-for="convo in conversations" :key="convo._id">
          <strong>You:</strong> {{ convo.userText }} <br/> <strong>AI:</strong> {{ convo.aiText }}
        </li>
      </ul>
      <p v-else>No history yet.</p>
    </div>

    <form @submit.prevent="sendMessage" class="input-form">
      <input
        type="text"
        v-model="userMessage"
        placeholder="Ask something..."
        :disabled="isLoading"
      />
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '...' : 'Send' }}
      </button>
    </form>
    <div id="status">{{ status }}</div>
  </main>
</template>

<style scoped>
  /* ... (CSS ส่วนใหญ่เหมือนเดิม) ... */
  .input-form {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
  .input-form input {
    flex-grow: 1;
    padding: 10px;
    border-radius: 20px;
    border: 1px solid #ccc;
    font-size: 16px;
  }
  .input-form button {
    padding: 10px 20px;
    border-radius: 20px;
    border: none;
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    font-size: 16px;
  }
  .input-form button:disabled {
    background-color: #cccccc;
  }
  .main-container, .history-box, .history-box li { /* ... CSS เดิม ... */ }
</style>