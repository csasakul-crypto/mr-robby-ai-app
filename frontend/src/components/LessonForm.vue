<script setup>
import { ref, watch, defineProps, defineEmits } from 'vue';

// --- VVV (แก้ไข) รับ Props ที่ถูกต้องจาก Settings.vue VVV ---
const props = defineProps({
  initialLesson: { // 1. เปลี่ยนจาก lesson เป็น initialLesson
    type: Object,
    default: () => ({})
  },
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create'
  }
});

// --- VVV (แก้ไข) ส่ง Event ที่ถูกต้องไปหา Settings.vue VVV ---
const emit = defineEmits(['saved', 'close']); // 2. เปลี่ยนจาก 'save' เป็น 'saved' และ 'cancel' เป็น 'close'

const formData = ref({});

// 3. เปลี่ยนให้เฝ้าดู props.initialLesson
watch(() => props.initialLesson, (newLesson) => {
  formData.value = { ...newLesson };
}, { immediate: true });

// 4. เปลี่ยนให้ emit 'saved'
function handleSubmit() {
  emit('saved', formData.value);
}
</script>

<template>
  <div class="form-overlay">
    <div class="form-container">
      
      <button type="button" class="close-btn" @click="$emit('close')">&times;</button>
      
      <h2>{{ mode === 'edit' ? 'Edit Lesson' : 'Create New Lesson' }}</h2>
      
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="studentGrade">Student Grade</label>
          <input type="text" id="studentGrade" v-model="formData.studentGrade" required>
        </div>
        <div class="form-group">
          <label for="lessonCode">Lesson Code</label>
          <input type="text" id="lessonCode" v-model="formData.lessonCode" required>
        </div>
        <div class="form-group">
            <label for="lessonName">Lesson Name</label>
            <input type="text" id="lessonName" v-model="formData.lessonName" required>
        </div>
        <div class="form-group">
          <label for="totalQuestions">Total Questions</label>
          <input type="number" id="totalQuestions" v-model="formData.totalQuestions" required>
        </div>
        <div class="form-group">
          <label for="storyContentTH">Story Content (Thai)</label>
          <textarea id="storyContentTH" v-model="formData.storyContentTH" rows="5" required></textarea>
        </div>
         <div class="form-group">
          <label for="storyContentEN">Story Content (English)</label>
          <textarea id="storyContentEN" v-model="formData.storyContentEN" rows="5" required></textarea>
        </div>
        <div class="form-group">
          <label for="initialPromptTH">Initial Prompt (Thai)</label>
          <textarea id="initialPromptTH" v-model="formData.initialPromptTH" rows="5" required></textarea>
        </div>
        <div class="form-group">
          <label for="initialPromptEN">Initial Prompt (English)</label>
          <textarea id="initialPromptEN" v-model="formData.initialPromptEN" rows="5" required></textarea>
        </div>
        <div class="form-group">
          <label for="QuestionFormActivitiesBook">Question Form Activities Book (Optional)</label>
          <textarea id="QuestionFormActivitiesBook" v-model="formData.QuestionFormActivitiesBook" rows="5" ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="save-btn">Save</button>
          <button type="button" @click="$emit('close')" class="cancel-btn">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* (CSS เหมือนเดิม) */
.form-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 100; }
.form-container { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; position: relative; }
.close-btn { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 2rem; color: #aaa; cursor: pointer; line-height: 1; padding: 0; }
.close-btn:hover { color: #000; }
.form-container h2 { color: #000; text-align: center; margin-top: 0; margin-bottom: 1.5rem; }
.form-group { margin-bottom: 1rem; color: #000; }
.form-group label { display: block; margin-bottom: 0.5rem; }
.form-group input, .form-group textarea { width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
.form-actions { text-align: right; margin-top: 1.5rem; }
.form-actions button { padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; margin-left: 0.5rem; }
.save-btn { background-color: #4CAF50; color: white; }
.cancel-btn { background-color: #f1f1f1; color: #333; }
</style>