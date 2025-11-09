<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <h2 class="page-title">Lesson Management</h2>
        <p class="page-subtitle">
          Manage all Mr. Robby AI lessons by grade, topic, and question set.
        </p>
      </div>
      <div>
        <CButton color="success" class="add-btn" @click="openCreateForm">
          + Add New Lesson
        </CButton>
      </div>
    </div>

    <CRow class="summary-row g-3">
      <CCol sm="6" md="3">
        <CCard class="summary-card primary">
          <CCardBody>
            <div class="label">Total Lessons</div>
            <div class="value">{{ totalLessons }}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm="6" md="3">
        <CCard class="summary-card secondary">
          <CCardBody>
            <div class="label">Grades</div>
            <div class="value">{{ groupedGrades.length }}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm="6" md="3">
        <CCard class="summary-card accent">
          <CCardBody>
            <div class="label">Today Created</div>
            <div class="value">{{ todayCreated }}</div>
          </CCardBody>
        </CCard>
      </CCol>
      <CCol sm="6" md="3">
        <CCard class="summary-card soft">
          <CCardBody>
            <div class="label">Last Updated</div>
            <div class="value">
              {{ lastUpdatedLabel }}
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>

    <CCard class="filters-card shadow-sm">
      <CCardBody class="d-flex flex-wrap align-items-center gap-3">
        <CInputGroup class="search-group">
          <CInputGroupText>
            🔍
          </CInputGroupText>
          <CFormInput v-model="search" placeholder="Search by lesson code or name..." />
        </CInputGroup>

        <CFormSelect v-model="selectedGrade" class="grade-select">
          <option value="">All Grades</option>
          <option v-for="g in groupedGrades" :key="g.name" :value="g.name">
            Grade: {{ g.name }}
          </option>
        </CFormSelect>

        <CButton color="light" size="sm" class="ms-auto" @click="resetFilters">
          Reset
        </CButton>
      </CCardBody>
    </CCard>

    <CCard class="lessons-card shadow-sm mt-3">
      <CCardBody>
        <div v-if="loading" class="py-4 text-center text-muted">
          <CSpinner size="sm" class="me-2" /> Loading lessons...
        </div>

        <div v-else-if="error" class="alert alert-danger mb-0">
          {{ error }}
        </div>

        <div v-else-if="filteredGroupedGrades.length === 0" class="py-4 text-center text-muted">
          No lessons found. Try adjusting filters or create a new lesson.
        </div>

        <CAccordion v-else always-open class="vuestic-accordion">
          <CAccordionItem v-for="grade in filteredGroupedGrades" :key="grade.name" :item-key="grade.name">
            <CAccordionHeader>
              <div class="grade-header">
                <span class="grade-label">Grade: {{ grade.name }}</span>
                <span class="grade-count">
                  {{ grade.lessons.length }} Lessons
                </span>
              </div>
            </CAccordionHeader>

            <CAccordionBody>
              <CTable hover responsive class="lessons-table align-middle mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col">
                      Lesson Code
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col">
                      Lesson Name
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" class="text-center">
                      Total Q
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" class="text-center">
                      Updated At
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" class="text-end">
                      Actions
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  <CTableRow v-for="lesson in grade.lessons" :key="lesson._id">
                    <CTableDataCell>
                      <span class="code-pill">
                        {{ lesson.lessonCode }}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      {{ lesson.lessonName }}
                    </CTableDataCell>
                    <CTableDataCell class="text-center">
                      <CBadge color="info" shape="rounded-pill">
                        {{ lesson.totalQuestions || 0 }}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell class="text-center small text-muted">
                      {{ formatDate(lesson.updatedAt) }}
                    </CTableDataCell>
                    <CTableDataCell class="text-end">
                      <CButton color="primary" variant="outline" size="sm" class="me-2" @click="openEditForm(lesson)">
                        Edit
                      </CButton>
                      <CButton color="danger" variant="outline" size="sm" @click="confirmDelete(lesson)">
                        Delete
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                </CTableBody>
              </CTable>
            </CAccordionBody>
          </CAccordionItem>
        </CAccordion>
      </CCardBody>
    </CCard>

    <div class="mt-3">
      <RouterLink to="/" class="back-link">
        ← Back to Launcher
      </RouterLink>
    </div>

    <LessonForm v-if="showForm" :visible="showForm" :mode="formMode" :initial-lesson="editingLesson"
      @saved="handleSaved" @close="closeForm" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CButton,
  CAccordion,
  CAccordionItem,
  CAccordionHeader,
  CAccordionBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CSpinner,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CFormSelect,
} from '@coreui/vue'
import LessonForm from '@/components/LessonForm.vue' // สมมติว่า path นี้ถูกต้อง

const lessons = ref([])
const loading = ref(true)
const error = ref('')

const showForm = ref(false)
const formMode = ref('create') // 'create' | 'edit'
const editingLesson = ref(null)

const search = ref('')
const selectedGrade = ref('')

const fetchLessons = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await axios.get('/api/lessons')
    lessons.value = Array.isArray(res.data) ? res.data : []
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load lessons from server.'
  } finally {
    loading.value = false
  }
}

const totalLessons = computed(() => lessons.value.length)

const groupedGrades = computed(() => {
  const groups = {}
  for (const l of lessons.value) {
    const g = l.studentGrade || 'Unassigned'
    if (!groups[g]) groups[g] = []
    groups[g].push(l)
  }
  return Object.keys(groups)
    .sort()
    .map((g) => ({
      name: g,
      lessons: groups[g].sort((a, b) =>
        (a.lessonCode || '').localeCompare(b.lessonCode || ''),
      ),
    }))
})

// สรุป Today / Last Updated
const todayCreated = computed(() => {
  const today = new Date().toDateString()
  return lessons.value.filter((l) => {
    const created = l.createdAt ? new Date(l.createdAt).toDateString() : ''
    return created === today
  }).length
})

const lastUpdatedLabel = computed(() => {
  if (!lessons.value.length) return '-'
  const last = lessons.value
    .filter((l) => l.updatedAt)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0]
  if (!last) return '-'
  const d = new Date(last.updatedAt)
  return d.toLocaleDateString()
})

// Filtered groups (search + grade)
const filteredGroupedGrades = computed(() => {
  const term = search.value.trim().toLowerCase()
  return groupedGrades.value
    .filter((g) => !selectedGrade.value || g.name === selectedGrade.value)
    .map((g) => {
      const filteredLessons = g.lessons.filter((l) => {
        if (!term) return true
        const code = (l.lessonCode || '').toLowerCase()
        const name = (l.lessonName || '').toLowerCase()
        return code.includes(term) || name.includes(term)
      })
      return { ...g, lessons: filteredLessons }
    })
    .filter((g) => g.lessons.length > 0)
})

const resetFilters = () => {
  search.value = ''
  selectedGrade.value = ''
}

// Actions: Form
const openCreateForm = () => {
  formMode.value = 'create'
  editingLesson.value = null
  showForm.value = true
}

const openEditForm = (lesson) => {
  formMode.value = 'edit'
  editingLesson.value = { ...lesson } // สร้าง copy เพื่อไม่ให้ข้อมูลในตารางเปลี่ยนตาม
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
}

// *** VVV นี่คือ Logic การ Save ที่ถูกต้อง (จาก Script ของคุณ) VVV ***
const handleSaved = async (lessonData) => {
  try {
    if (formMode.value === 'edit' && lessonData._id) {
      // 1. ถ้าเป็นโหมด "แก้ไข" (Edit) -> ให้ยิง API "PUT" (อัปเดต)
      await axios.put(`/api/lessons/${lessonData._id}`, lessonData);
    } else {
      // 2. ถ้าเป็นโหมด "สร้างใหม่" (Create) -> ให้ยิง API "POST" (สร้าง)
      await axios.post('/api/lessons', lessonData);
    }

    // 3. เมื่อยิง API สำเร็จ (ไม่ Error) ค่อยปิดฟอร์มและโหลดข้อมูลใหม่
    showForm.value = false;
    await fetchLessons();

  } catch (err) {
    console.error("Failed to save lesson:", err);
    alert("Error: Could not save lesson. Check console for details.");
    // ถ้า Error เราจะไม่ปิดฟอร์ม ให้ผู้ใช้ลองอีกครั้ง
  }
}
// *** ^^^ --------------------------------------------- ^^^ ***

// Delete (ใช้ Logic จาก Script ของคุณ)
const confirmDelete = async (lesson) => {
  if (
    !window.confirm(
      `Delete lesson "${lesson.lessonCode} - ${lesson.lessonName}" ?`,
    )
  )
    return
  try {
    await axios.delete(`/api/lessons/${lesson._id}`)
    await fetchLessons()
  } catch (err) {
    console.error(err)
    alert('Failed to delete lesson.')
  }
}

const formatDate = (value) => {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString()
}

onMounted(() => {
  fetchLessons()
})
</script>

<style scoped>
/* --- VVV นี่คือ CSS ที่ทำให้สวยครับ VVV --- */
.settings-page {
  padding: 24px 8px 32px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: #6c757d;
}

.add-btn {
  font-weight: 500;
  padding-inline: 18px;
  border-radius: 999px;
}

.summary-row {
  margin-top: 16px;
}

.summary-card {
  border: none;
  border-radius: 18px;
  color: #fff;
}

.summary-card .label {
  font-size: 11px;
  opacity: 0.9;
}

.summary-card .value {
  font-size: 22px;
  font-weight: 600;
  margin-top: 4px;
}

.summary-card.primary {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.summary-card.secondary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.summary-card.accent {
  background: linear-gradient(135deg, #f97316, #ea580c);
}

.summary-card.soft {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.filters-card {
  margin-top: 18px;
  border-radius: 18px;
  border: none;
}

.search-group {
  flex: 1 1 260px;
  max-width: 420px;
}

.grade-select {
  width: 180px;
}

.lessons-card {
  border-radius: 18px;
  border: none;
  margin-top: 16px;
}

.vuestic-accordion :deep(.accordion-item) {
  border: none;
  border-radius: 14px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.vuestic-accordion :deep(.accordion-button) {
  border-radius: 14px !important;
  background-color: #f9fafb;
  font-weight: 500;
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
}

.grade-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.grade-label {
  font-size: 14px;
}

.grade-count {
  font-size: 11px;
  color: #6b7280;
}

.lessons-table {
  font-size: 13px;
}

.code-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background-color: #eff6ff;
  color: #2563eb;
  font-weight: 500;
}

.back-link {
  font-size: 13px;
  color: #6b7280;
  text-decoration: none;
}

.back-link:hover {
  color: #111827;
  text-decoration: underline;
}
</style>