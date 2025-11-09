<script setup>
// (แก้ไข) Import main.css ที่นี่
import '../styles/main.css'; 
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

// ... (Logic <script setup> ทั้งหมดของคุณ... ถูกต้อง) ...
const studentProfiles = ref([
  {
    language: 'th-TH',
    studentId: '12345',
    schoolCode: 'YALA 1',
    studentGrade: '4.1',
    lessonCode: '4TP2',
    lessonName: 'Topic 2 What time is it?', 
    studentNameTH: 'เชษฐา สาสะกุล', 
    studentNameEN: 'Chettha Sasakul', 
    schoolNameTH: 'เทศบาลตำบลหัวทะเล',
    schoolNameEN: 'Huathala School',
  },
  {
    language: 'en-US',
    studentId: '1155',
    schoolCode: 'DHM 1',
    studentGrade: '4.2',
    lessonCode: '4TP2',
    lessonName: 'Topic 2 What time is it? (3.2)', 
    studentNameTH: 'เชษฐา สาสะกุล', 
    studentNameEN: 'Chettha Sasakul', 
    schoolNameTH: 'เทศบาลตำบลหัวทะเล',
    schoolNameEN: 'Huathala School',
  },
  {
    language: 'th-TH',
    studentId: '34567',
    schoolCode: 'Yala55',
    studentGrade: '4.1',
    lessonCode: 'Tour1',
    lessonName: 'Topic 1 Greetings (4.1)', 
    studentNameTH: 'เชษฐา สาสะกุล', 
    studentNameEN: 'Chettha Sasakul', 
    schoolNameTH: 'เทศบาลตำบลหัวทะเล',
    schoolNameEN: 'Huathala School',
  },
  {
    language: 'en-US',
    studentId: '34567',
    schoolCode: 'Yala55',
    studentGrade: '4.1',
    lessonCode: 'Tour1',
    lessonName: 'Topic 1 Greetings (4.1)', 
    studentNameTH: 'เชษฐา สาสะกุล', 
    studentNameEN: 'Chettha Sasakul', 
    schoolNameTH: 'เทศบาลตำบลหัวทะเล',
    schoolNameEN: 'Huathala School',
  }

]);

const selectedProfile = ref(studentProfiles.value[0]);

const generatedUrl = computed(() => {
  if (!selectedProfile.value) return '';
  const query = new URLSearchParams(selectedProfile.value).toString();
  return `${window.location.origin}/chat?${query}`;
});

function startChat() {
  if (!selectedProfile.value) {
    alert('Please select a student profile first.');
    return;
  }
  router.push(generatedUrl.value.replace(window.location.origin, ''));
}
</script>

<template>
  <div> 
    <Teleport to="head">
      <component :is="'script'" src="https://cdn.tailwindcss.com"></component>
    </Teleport>
    <router-link to="/settings" class="settings-button">⚙️</router-link>
    <img src="https://app.braincloudlearning.com/img/cloud-blue.png" class="background-image" alt="Cloud pattern background" />

    <div class="box launch-box">
      <h1 class="title">Mr. Robby AI Launcher</h1>
      <p class="subtitle">Simulating data from Braincloud</p>
      <hr />
      <div class="profile-selector">
        <h3>Select a student profile to test:</h3>
        <div class="options-grid">
          <div 
            class="profile-option" 
            v-for="(profile, index) in studentProfiles" 
            :key="profile.studentId"
          >
            <input 
              type="radio" 
              :id="'profile-' + index" 
              :value="profile" 
              v-model="selectedProfile"
            >
            <label :for="'profile-' + index">
              <pre>{{ profile }}</pre>
            </label>
          </div>
        </div>
      </div>
      <button class="start-button" @click="startChat">🚀 Start Chat with AI</button>
      <div class="url-display">
        <label for="generated-url">Generated URL (GET Parameters):</label>
        <input id="generated-url" type="text" :value="generatedUrl" readonly>
      </div>
    </div>
     <footer id="page-footer">
      © 2025 Braincloud Learning Inc. All rights reserved.
    </footer>
  </div>
</template>

<style scoped>
/* (โค้ด <style scoped> ทั้งหมดของคุณ... ถูกต้อง) */
.launch-box {
  width: 100%;
  max-width: 1255px;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 3rem;
  z-index: 1;
}
.title { font-size: 2rem; font-weight: bold; margin-bottom: 0.5rem; }
.subtitle { font-size: 1rem; opacity: 0.8; margin-bottom: 1.5rem; }
hr {
  width: 100%;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 1.5rem;
}
.profile-selector {
  width: 100%;
  margin-bottom: 1.5rem;
  text-align: left;
}
.profile-selector h3 {
  margin-bottom: 1rem;
  font-weight: bold;
}
.options-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.profile-option {
  display: flex;
  align-items: flex-start;
  background-color: rgba(0, 0, 0, 0.1);
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border: 2px solid transparent;
  height: 100%;
}
.profile-option:hover {
  background-color: rgba(0, 0, 0, 0.2);
}
.profile-option input[type="radio"] {
  margin-right: 1rem;
  margin-top: 0.5rem;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.profile-option label {
  cursor: pointer;
  width: 100%;
}
.profile-option pre {
  margin: 0;
  padding: 0;
  font-family: monospace;
  font-size: 0.85rem;
  text-align: left;
  line-height: 1.5;
  white-space: pre-wrap;
  color: #e0e7ff;
}
.start-button {
  background-color: #4CAF50;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 50px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  margin-top: 1rem;
  margin-bottom: 1.5rem;
}
.start-button:hover {
  background-color: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.3);
}
.url-display { width: 100%; text-align: left; }
.url-display label { font-size: 0.8rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 0.25rem; display: block; }
.url-display input { width: 100%; padding: 0.5rem; border-radius: 4px; border: 1px solid rgba(255, 255, 255, 0.3); background-color: rgba(0, 0, 0, 0.2); color: #fff; font-family: monospace; font-size: 0.85rem; box-sizing: border-box; }
.settings-button {
  position: absolute;
  top: 2rem;
  right: 2rem;
  font-size: 2rem;
  text-decoration: none;
  color: white;
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s;
  z-index: 10;
}
.settings-button:hover {
  opacity: 1;
  transform: rotate(45deg);
}

@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
  .launch-box {
    padding: 1.5rem;
  }
}
</style>