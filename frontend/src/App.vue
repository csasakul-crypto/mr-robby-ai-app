<script setup>
import { computed } from 'vue';
import { useChat } from './composables/useChat.js';

// นำเข้า Logic และ State ทั้งหมดจาก useChat.js
const {
  mainLayoutVisible,
  aiResponse,
  userInput,
  status,
  evaluationResult,
  evaluationVisible,
  isLoading,
  currentQuestionNumber,
  totalQuestions,
  langConfig,
  currentLanguage,
  initializeApp,
  handleTalkButtonClick,
  restartLesson
} = useChat();

// สร้าง computed property เพื่อให้ง่ายต่อการเข้าถึง UI text
const ui = computed(() => langConfig[currentLanguage.value].ui);

// หา path ของรูปภาพ
const robbyImage = new URL('./assets/Mr_Robby_AI.gif', import.meta.url).href;

</script>

<template>
  <div id="app-container">
    <div id="language-selection-overlay" v-if="!mainLayoutVisible">
      <div class="selection-box">
        <h2>Please select a language<br>โปรดเลือกภาษา</h2>
        <button id="select-th" @click="initializeApp('th-TH')">ภาษาไทย</button>
        <button id="select-en" @click="initializeApp('en-US')">English</button>
      </div>
    </div>

    <img src="https://app.braincloudlearning.com/img/cloud-blue.png" class="background-image" alt="Cloud pattern background" />

    <div class="main-layout" v-if="mainLayoutVisible">
      <div class="box box-a" id="boxA">
        <div class="w-full flex flex-col items-center gap-2">
          <img :src="robbyImage" alt="Robot talking" class="box-a-image" />
          <div class="text-center text-sm font-semibold mt-2">Mr. Robby AI</div>
          <hr class="w-full my-2 border-t border-gray-300">
          <span class="text-base font-semibold text-white">Questions</span>
          <div class="flex flex-col gap-2">
            <div v-for="n in totalQuestions" :key="n" :id="`q-box-${n}`"
              class="progress-box w-10 h-10 rounded-full bg-white text-gray-800 font-bold flex items-center justify-center question-number-dot"
              :class="{ 'completed': n < currentQuestionNumber, 'active': n === currentQuestionNumber }">
              {{ n }}
            </div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="box-b">
          BC 4.1 Topic 2: What time is it?
          <div class="box-b-upper">
            <div id="ai-response" class="message" :class="{ 'ai-speaking': isLoading && status === ui.aiIsSpeaking }" v-show="!evaluationVisible" v-html="aiResponse.replace(/\n/g, '<br>')"></div>
            <div id="evaluation-box" v-show="evaluationVisible" :class="{ 'visible': evaluationVisible }">
               <h3>{{ ui.evaluationResultTitle }}</h3>
               <p v-html="evaluationResult.replace(/\n/g, '<br>')"></p>
            </div>
            <div class="Control-AI w-full items-center justify-center gap-4 px-4 mt-4 mb-4" v-show="!evaluationVisible">
              <div id="user-input" class="message user-message" :class="{ 'listening': isLoading && status === ui.listening }">{{ userInput }}</div>
            </div>
          </div>
          <center>
            <div id="status">{{ status }}</div>
            <button v-if="!evaluationVisible" id="talk-button" @click="handleTalkButtonClick" :disabled="isLoading">
              {{ isLoading ? ui.pleaseWait : ui.pushToTalk }}
            </button>
            <button v-if="evaluationVisible" id="finish-button" @click="restartLesson">
              {{ ui.tryAgain }}
            </button>
          </center>
        </div>
      </div>
    </div>

    <footer id="page-footer">
      © 2025 Braincloud Learning Inc. All rights reserved.
    </footer>
  </div>
</template>

<style>
/* นำเข้า CSS จากไฟล์ภายนอก */
@import './styles/main.css';
</style>
