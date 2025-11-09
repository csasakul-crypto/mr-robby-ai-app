import { ref, computed } from 'vue';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid'; // <-- 1. Import library สร้าง ID เฉพาะ

// 1. รับ sessionData เข้ามาเป็น parameter
export function useChat(sessionData) {

    const mainLayoutVisible = ref(true); //ปิดภาษา
    const aiResponse = ref('...');
    const userInput = ref('...');
    const status = ref('...');
    const evaluationResult = ref('');
    const evaluationVisible = ref(false);
    const isLoading = ref(false);
    const currentQuestionNumber = ref(0);
    const totalQuestions = ref(5); // <-- เปลี่ยนเป็น ref และให้ค่า default
    const currentLanguage = ref(sessionData.language || 'th-TH'); // <-- ใช้ภาษาจาก sessionData
    const conversationHistory = ref([]);
    let recognition;
    let audioContext = null;
    const startTime = ref(null);
    const sessionId = ref(null);
    const lessonDetails = ref(null); 
    const showFinishButton = ref(false);

    const currentAudioSource = ref(null); // <--- (เพิ่ม 1) State ใหม่สำหรับเก็บเสียงที่กำลังเล่น

    const langConfig = {
        'th-TH': {
            speechRecLang: 'th-TH', ttsLang: 'th-TH', ttsVoice: 'th-TH-Chirp3-HD-Schedar',
            ui: {
                initialGreeting: "สวัสดี ฉันคือ Mr. Robby AI วันนี้เราจะคุยกันเกี่ยวกับ \n Topic ที่ 2 เรื่อง What time is it? พร้อมแล้วกดปุ่มค้างไว้เพื่อคุยกับฉันได้เลยครับ",
                pushToTalk: "กดค้างเพื่อพูด", waitingToStart: "รอเริ่มการสนทนา", aiIsSpeaking: "AI กำลังพูด...",
                pleaseWait: "รอสักครู่...", errorGeneratingSpeech: "ขออภัย, เกิดปัญหาในการสร้างเสียงพูด",
                listening: "กำลังฟัง...", waitingForYou: "กำลังรอคุณพูดอยู่...", youSaid: "คุณพูดว่า:",
                errorOccurred: "เกิดข้อผิดพลาด:", pressToSpeakAgain: "กดปุ่มเพื่อพูดอีกครั้ง",
                sendingToAI: "กำลังส่งคำตอบให้ AI...", connectionError: "ขออภัย, มีปัญหาในการเชื่อมต่อกับ AI",
                finish: "เสร็จสิ้น", pressForEvaluation: "กดปุ่มเพื่อดูผลการประเมิน",
                evaluationResultTitle: "ผลการประเมิน", lessonFinished: "บทเรียนจบแล้ว",
                question: "คำถามที่", pressToStart: "กดปุ่มเพื่อเริ่มตอบคำถาม", tryAgain: "ลองอีกครั้ง",
                textEnd: "เยี่ยมมากๆเลย แล้วพบกันกับ Mr. Robby ใน บทเรียนหน้ากันนะ"
            }
        },
        'en-US': {
            speechRecLang: 'en-US', ttsLang: 'en-US', ttsVoice: 'en-US-Standard-J',
            ui: {
                initialGreeting: "Hello, I'm Mr. Robby AI. Today, we'll talk about \nTopic 2: What time is it? When you're ready, press and hold the button to talk to me..",
                pushToTalk: "hold the button to Talk", waitingToStart: "Waiting to start conversation", aiIsSpeaking: "AI is speaking...",
                pleaseWait: "Please wait...", errorGeneratingSpeech: "Sorry, there was a problem generating speech.",
                listening: "Listening...", waitingForYou: "Waiting for you to speak...", youSaid: "You said:",
                errorOccurred: "An error occurred:", pressToSpeakAgain: "Press the button to speak again",
                sendingToAI: "Sending response to AI...", connectionError: "Sorry, there was a problem connecting to the AI.",
                finish: "Finish", pressForEvaluation: "Press the button to see the evaluation",
                evaluationResultTitle: "Evaluation Result", lessonFinished: "Lesson finished.",
                question: "Question", pressToStart: "Press the button to start answering", tryAgain: "Try again",
                textEnd: "Great job! See you next lesson with Mr. Robby!"

            }
        }
    };

// --- (เพิ่ม) ตัวแปรสำหรับจับเวลาการกด
    let pressTimer = null;

    // --- (เพิ่ม) ฟังก์ชันเล่นเสียง BEEP (ข้อ 2) ---
    function playBeep() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        // ป้องกันเสียง Beep ดังขณะที่ AI กำลังพูด
        if (currentAudioSource.value) return; 

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // ความถี่เสียง Beep
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime); // ความดัง (ไม่ดังเกินไป)
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1); // Beep สั้นๆ 100ms
    }
    // --- ^^^ -----------------------------------

    function cleanText(text) {
        return text ? text.replace(/[*#]/g, '') : '';
    }

    async function speak(text, onEndCallback = null) {
        const ui = langConfig[currentLanguage.value].ui;
        aiResponse.value = '...';
        status.value = ui.aiIsSpeaking;
        isLoading.value = true;

        // --- VVV (แก้ไข) หยุดเสียงเก่า (ถ้ามี) ก่อนเล่นเสียงใหม่ ---
        if (currentAudioSource.value) {
            currentAudioSource.value.stop();
            currentAudioSource.value = null;
        }

        try {
            const response = await axios.post('/api/tts', {
                text: text,
                languageCode: langConfig[currentLanguage.value].ttsLang,
                voiceName: langConfig[currentLanguage.value].ttsVoice,
                sessionId: sessionId.value // <-- ส่ง sessionId
            });

            const audioData = atob(response.data.audioContent);
            const audioBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(audioBuffer);
            for (let i = 0; i < audioData.length; i++) {
                view[i] = audioData.charCodeAt(i);
            }

            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } else if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
            const audioSource = audioContext.createBufferSource();

            audioSource.buffer = decodedBuffer;
            audioSource.connect(audioContext.destination);

            currentAudioSource.value = audioSource; // <--- (แก้ไข) เก็บเสียงที่กำลังจะเล่นไว้

            aiResponse.value = text;
            audioSource.start(0);

            audioSource.onended = () => {
                currentAudioSource.value = null; // <--- (แก้ไข) เคลียร์เสียงเมื่อเล่นจบ
                if (onEndCallback) {
                    onEndCallback();
                } else {
                    status.value = ui.waitingForYou;
                    isLoading.value = false;
                }
            };
        } catch (error) {
            console.error("❌ ERROR in speak():", error);
            status.value = ui.errorGeneratingSpeech;
            isLoading.value = false;
            currentAudioSource.value = null; // <--- (แก้ไข) เคลียร์เสียงถ้า Error
        }
    }

// <--- (เพิ่ม 2) ฟังก์ชันสำหรับจัดการเมื่อพับจอ/สลับแท็บ ---
    function handleVisibilityChange() {
        const ui = langConfig[currentLanguage.value].ui;
        // ถ้าหน้าเว็บถูกซ่อน (พับจอ)
        if (document.hidden) {
            if (currentAudioSource.value) {
                currentAudioSource.value.stop(); // สั่งหยุดเล่น (ไม่ใช่แค่ Pause)
                currentAudioSource.value = null;

                // รีเซ็ต UI ให้กลับสู่สถานะรอ (สำคัญมาก)
                isLoading.value = false;
                status.value = ui.waitingForYou;
            }
        }
    }
    // <--- ---------------------------------------------

function setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("เบราว์เซอร์นี้ไม่รองรับ Speech Recognition");
            status.value = "เบราว์เซอร์ไม่รองรับการพูด";
            return;
        }
        recognition = new SpeechRecognition();
        recognition.lang = langConfig[currentLanguage.value].speechRecLang;
        recognition.interimResults = false;
        recognition.continuous = true; // <--- (สำคัญ) ต้องเปิดโหมดฟังต่อเนื่อง

        recognition.onstart = () => {
            // เราจะควบคุม Status เองจาก startListening()
        };

        recognition.onresult = (event) => {
            // เราจะไม่ส่งผลลัพธ์ทันที แต่จะรอ onend
        };

        recognition.onerror = (event) => {
            status.value = `${langConfig[currentLanguage.value].ui.errorOccurred} ${event.error}`;
            isLoading.value = false;
            if (pressTimer) clearTimeout(pressTimer);
        };

        // --- VVV (แก้ไข) Logic ตอนที่การฟังจบ (ไม่ว่าจะพูดหรือไม่) VVV ---
        recognition.onend = () => {
            // ถ้าสถานะยังเป็น "กำลังฟัง" (แปลว่าผู้ใช้ปล่อยปุ่ม)
            if (status.value === ui.value.listening) {
                // เช็กว่า SpeechRecognition ได้ผลลัพธ์สุดท้ายมาหรือยัง
                // (นี่เป็นการดัดแปลงเล็กน้อยเพื่อดึงผลลัพธ์)
                const lastResult = recognition._lastResult; // (อาจต้องเช็กว่า property นี้ชื่ออะไร)
                
                // --- (วิธีที่ง่ายกว่า) ---
                // เราจะใช้ onresult ในการเก็บผลลัพธ์
            }
        };

        // --- VVV (วิธีที่ง่ายและดีกว่า) ---
        // เราจะลบ `recognition.continuous = true;` ออก
        // และใช้ Logic `onend` เพื่อรีเซ็ตสถานะ
        
        // (ลบ `recognition.continuous = true;` ออก)
        // ...
        
        // (แก้ไข onresult)
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = `${langConfig[currentLanguage.value].ui.youSaid} "${transcript}"`;
            sendToAI(transcript); // ส่งไป AI ทันที
        };
        
        // (แก้ไข onend)
        recognition.onend = () => {
            // ถ้าสถานะยังเป็น "กำลังฟัง" (แปลว่าผู้ใช้ปล่อยปุ่ม)
            // หรือ "รอ" (ปล่อยก่อน 1 วิ)
            if (status.value === ui.value.listening || status.value === ui.value.pleaseWait) {
                 isLoading.value = false;
                 status.value = ui.value.pressToSpeakAgain;
            }
            if (pressTimer) clearTimeout(pressTimer);
        };
        // --- ^^^ -----------------------------------
    }

    async function sendToAI(userText) {
        isLoading.value = true;
        status.value = ui.value.sendingToAI; // <-- ใช้ ui.value
        const uix = langConfig[currentLanguage.value].ui;

        try {
            const historyToSend = conversationHistory.value.map(item => ({
                role: item.role,
                text: item.parts[0].text
            }));

            const response = await axios.post('/api/chat', {
                userMessage: userText,
                history: historyToSend,
                language: currentLanguage.value,
                // --- VVV ส่งข้อมูลบทเรียนและ Session ID ไปด้วย VVV ---
                lessonCode: sessionData.lessonCode, // ส่ง lessonCode ที่ได้รับมา
                totalQuestions: totalQuestions.value, // ส่งจำนวนคำถามที่ดึงมา
                lessonName: lessonDetails.value?.lessonName || sessionData.lessonName, // ส่งชื่อบทเรียน
                sessionData: { // ส่งข้อมูลนักเรียน/โรงเรียน
                    ...sessionData,
                    startTime: startTime.value
                },
                sessionId: sessionId.value
                // ----------------------------------------------------
            });

            const aiText = cleanText(response.data.reply);
            conversationHistory.value.push({ role: "user", parts: [{ text: userText }] });
            conversationHistory.value.push({ role: "model", parts: [{ text: aiText }] });

            // if (aiText.includes('EVALUATION:')) {
            //     const parts = aiText.split('EVALUATION:');
            //     const preEvaluationText = parts[0].trim();
            //     evaluationResult.value = parts[1].trim();

            //     speak(preEvaluationText, () => {
            //         evaluationVisible.value = true;
            //         isLoading.value = false;
            //         status.value = langConfig[currentLanguage.value].ui.pressForEvaluation;
            //     });

            // } 
            if (aiText.includes('{EVALUATION:}')) {
                const ui = langConfig[currentLanguage.value].ui;
                const textToSpeak = ui.textEnd;
                isLoading.value = false;
                //speak(textToSpeak);
                const parts = aiText.split('{EVALUATION:}');
                const preEvaluationText = cleanText(parts[0].trim());
                const evaluationText = parts[1].trim();
                speak(preEvaluationText);
     
                evaluationVisible.value = true;
                currentQuestionNumber.value++; //
                evaluationResult.value = evaluationText;
 
                // speak(textToSpeak, () => { 
                //     isLoading.value = false;
                //     status.value = ui.value.pressForEvaluation;
                //     lessonFinished.value = true; 
                // });

                // const closingRemarksMatch = parts[0].match(/([^\n]+)$/); // หาทุกอย่างในบรรทัดสุดท้ายก่อน EVALUATION
                // const textToSpeak = closingRemarksMatch ? closingRemarksMatch[0].trim() : "เก่งมากเจอกันในบทเรียนหน้าครับ!"; // ถ้าหาไม่เจอ ใช้คำพูด default

                // evaluationResult.value = parts[1].trim(); // ข้อความ EVALUATION (เหมือนเดิม)

                // //console.log("Text to speak:", textToSpeak); // แสดงผลเพื่อ Debug
           
                // // 2. ส่งเฉพาะข้อความปิดท้ายสั้นๆ ไปให้ speak
                // speak(textToSpeak, () => {
                //     evaluationVisible.value = true;
                //     isLoading.value = false;
                //     status.value = ui.value.pressForEvaluation; // ใช้ ui.value
                // });
                // // --- ^^^ จบส่วนแก้ไข ^^^ ---

            }else {
                // 1. สร้าง Pattern สำหรับ "ข้อถัดไป"
                const nextQuestionNumber = currentQuestionNumber.value + 1;
                //    (เช่น new RegExp('Q2:'))
                const nextQuestionPattern = new RegExp(`Q${nextQuestionNumber}:`);

                // 2. ตรวจสอบว่า AI กำลังถาม "ข้อถัดไป" หรือไม่
                if (nextQuestionPattern.test(aiText) && currentQuestionNumber.value < totalQuestions.value) {

                    // 2.1 ใช่ -> เลื่อนขั้น
                    currentQuestionNumber.value++;
                    const questionOnlyText = aiText.replace(/Q\d+:\s*/, `${ui.value.question} ${currentQuestionNumber.value}: `);
                    speak(questionOnlyText);

                    // 3. ตรวจสอบว่า AI แค่ "ทวนข้อเดิม" หรือให้ Feedback ที่มี "Q[เลข]:" หรือไม่
                } else if (/Q\d+:/.test(aiText)) {

                    // 3.1 ใช่ -> แค่พูด แต่ "ไม่" เลื่อนขั้น (ไม่บวกเลข)
                    const questionOnlyText = aiText.replace(/Q\d+:\s*/, `${ui.value.question} ${currentQuestionNumber.value}: `); // ใช้เลขข้อปัจจุบัน
                    speak(questionOnlyText);

                    // 4. ถ้าเป็นคำตอบทั่วไป (เช่น "Correct", "Good job")
                } else {
                    speak(aiText);
                }
            }


            // else if (/Q\d+:/.test(aiText)) {
            //     if (currentQuestionNumber.value < totalQuestions.value) {
            //         currentQuestionNumber.value++;
            //     }
            //     // <-- ใช้ ui.value
            //     const questionOnlyText = aiText.replace(/Q\d+:\s*/, `${ui.value.question} ${currentQuestionNumber.value}: `);
            //     speak(questionOnlyText);
            // } else {
            //     speak(aiText);
            // }

        } catch (error) {
            console.error("ERROR in sendToAI():", error);
            status.value = ui.value.connectionError; 
            isLoading.value = false;
        }
    }

    // --- แก้ไข initializeApp ---
    async function initializeApp() { // <-- ทำให้เป็น async
        sessionId.value = uuidv4();
        console.log("Session ID:", sessionId.value);
        startTime.value = new Date();
        currentLanguage.value = sessionData.language; // ตั้งค่าภาษา

        document.addEventListener('visibilitychange', handleVisibilityChange); // <--- (เพิ่ม 3) สั่งให้เบราว์เซอร์เริ่มดักฟัง

        try {
            // --- VVV ดึงข้อมูลบทเรียนจาก Backend VVV ---
            console.log(`Fetching lesson details for code: ${sessionData.lessonCode}`);
            const lessonResponse = await axios.get(`/api/lessons/code/${sessionData.lessonCode}`);
            lessonDetails.value = lessonResponse.data;
            totalQuestions.value = lessonDetails.value.totalQuestions; // อัปเดตจำนวนคำถาม
            console.log("Lesson details fetched:", lessonDetails.value);
            // --------------------------------------

            // สร้าง Greeting โดยใช้ชื่อบทเรียนที่ดึงมา
            const lessonName = lessonDetails.value.lessonName;
            const greetingTemplate = langConfig[currentLanguage.value].ui.initialGreeting;
            // แทนที่ Placeholder (ถ้ามี) หรือสร้างข้อความใหม่
            // ตัวอย่าง: ถ้า greetingTemplate คือ "Hello! Today we talk about {lessonName}."
            // const initialGreeting = greetingTemplate.replace('{lessonName}', lessonName);
            // หรือสร้างใหม่แบบง่ายๆ:
            const initialGreeting = currentLanguage.value === 'th-TH'
                ? `สวัสดี! วันนี้เราจะคุยกันเรื่อง "${lessonName}" นะครับ กดปุ่มและพูดคำว่า "ฉันพร้อมแล้ว" เพื่อเริ่ม`
                : `Hello! Today we'll talk about "${lessonName}". Press the Say "I'm Ready" button to begin.`;


            conversationHistory.value = [{ role: "model", parts: [{ text: initialGreeting }] }];
            status.value = ui.value.pressToStart; // <-- ใช้ ui.value
            mainLayoutVisible.value = true; //ปิดภาษา
            currentQuestionNumber.value = 1;
            setupSpeechRecognition();

            speak(initialGreeting, () => {
                status.value = ui.value.waitingForYou; // <-- ใช้ ui.value
                isLoading.value = false;
            });

        } catch (error) {
            console.error("❌ ERROR fetching lesson details:", error);
            // แสดงข้อผิดพลาดบน UI
            status.value = `Error: Could not load lesson ${sessionData.lessonCode}`;
            aiResponse.value = `Failed to load lesson details. Please check the lesson code or contact support.`;
            mainLayoutVisible.value = true; // ยังคงแสดงหน้าจอหลัก แต่มีข้อความ Error
        }
    }
// --- VVV (เพิ่ม) ฟังก์ชันใหม่ 2 ตัว VVV ---
    function startListening() {
        const ui = langConfig[currentLanguage.value].ui;
        // ถ้า AI กำลังพูด หรือกำลังโหลดอยู่ ห้ามรบกวน
        if (isLoading.value) return; 

        isLoading.value = true;
        status.value = ui.pleaseWait; // 1. สถานะ "รอสักครู่"
        
        // เริ่มจับเวลา 1 วินาที (ข้อ 1)
        pressTimer = setTimeout(() => {
            status.value = ui.listening; // 2. สถานะ "กำลังฟัง" (ปุ่มจะเปลี่ยนสี)
            
            // 3. เล่นเสียง Beep (ข้อ 2)
            playBeep();
            
            // 4. สั่น (ข้อ 2)
            if ('vibrate' in navigator) {
                navigator.vibrate(100);
            }
            
            // 5. เริ่มฟังเสียง *หลังจาก* 1 วินาที
            if (recognition) {
                recognition.start();
            }
        }, 800); // ตั้งไว้ 0.8 วินาที (เร็วกว่า 1 วิเล็กน้อย)
    }

    function stopListening() {
        const ui = langConfig[currentLanguage.value].ui;
        
        // ถ้าผู้ใช้ปล่อยมือก่อน 1 วินาที
        if (status.value === ui.pleaseWait) {
            clearTimeout(pressTimer); // ยกเลิกการนับเวลา
            isLoading.value = false;
            status.value = ui.pushToTalk; // กลับไปสถานะปกติ
        } 
        // ถ้าผู้ใช้ปล่อยมือ *หลังจาก* 1 วินาที (ขณะที่กำลังฟัง)
        else if (status.value === ui.listening) {
            if (recognition) {
                recognition.stop(); // สั่งหยุดฟัง
                // `recognition.onend` หรือ `recognition.onresult` จะทำงานต่อเอง
            }
        }
    }
    // --- ^^^ ------------------------------


    // function handleTalkButtonClick() {
    //     if (recognition && !isLoading.value) {
    //         isLoading.value = true;
    //         recognition.start();
    //     }
    // }

    function restartLesson() {
        document.removeEventListener('visibilitychange', handleVisibilityChange); // <--- (เพิ่ม 4) หยุดดักฟังเมื่อ Restart
        location.reload();
    }

    const ui = computed(() => langConfig[currentLanguage.value].ui);

    // --- Return ค่าต่างๆ ---
    return {
        mainLayoutVisible, aiResponse, userInput, status,
        evaluationResult, evaluationVisible, isLoading,
        currentQuestionNumber, totalQuestions, // <-- ส่ง totalQuestions (ที่เป็น ref) ออกไป
        currentLanguage, initializeApp,
        startListening,  // (เพิ่มตัวใหม่)
        stopListening,   // (เพิ่มตัวใหม่)
        restartLesson, ui,showFinishButton,
        lessonDetails // <-- (สำคัญ) เพิ่มบรรทัดนี้เข้าไป
    };
}