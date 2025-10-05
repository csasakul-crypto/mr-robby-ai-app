import { ref } from 'vue';
import axios from 'axios';

// ฟังก์ชันนี้จะถูก export ออกไปให้ App.vue ใช้งาน
export function useChat() {
    

    // --- สถานะของแอปพลิเคชัน (Reactive State) ---
    const mainLayoutVisible = ref(false);
    const aiResponse = ref('...');
    const userInput = ref('...');
    const status = ref('...');
    const evaluationResult = ref('');
    const evaluationVisible = ref(false);
    const isLoading = ref(false);
    const currentQuestionNumber = ref(0);
    const totalQuestions = 5;
    const currentLanguage = ref('th-TH');
    const conversationHistory = ref([]);
    let recognition;
    let audioContext = null;

    // --- การตั้งค่าภาษา ---
    const langConfig = {
        'th-TH': {
            speechRecLang: 'th-TH', ttsLang: 'th-TH', ttsVoice: 'th-TH-Chirp3-HD-Schedar',
            ui: {
                initialGreeting: "สวัสดี ฉันคือ Mr. Robby AI วันนี้เราจะคุยกันเกี่ยวกับ \n Topic ที่ 2 เรื่อง What time is it? ถ้าพร้อมแล้วกดปุ่มเพื่อคุยกับฉันได้เลยครับ",
                pushToTalk: "กดเพื่อพูด", waitingToStart: "รอเริ่มการสนทนา", aiIsSpeaking: "AI กำลังพูด...",
                pleaseWait: "รอสักครู่...", errorGeneratingSpeech: "ขออภัย, เกิดปัญหาในการสร้างเสียงพูด",
                listening: "กำลังฟัง...", waitingForYou: "กำลังรอคุณพูดอยู่...", youSaid: "คุณพูดว่า:",
                errorOccurred: "เกิดข้อผิดพลาด:", pressToSpeakAgain: "กดปุ่มเพื่อพูดอีกครั้ง",
                sendingToAI: "กำลังส่งคำตอบให้ AI...", connectionError: "ขออภัย, มีปัญหาในการเชื่อมต่อกับ AI",
                finish: "เสร็จสิ้น", pressForEvaluation: "กดปุ่มเพื่อดูผลการประเมิน",
                evaluationResultTitle: "ผลการประเมิน", lessonFinished: "บทเรียนจบแล้ว",
                question: "คำถามที่", pressToStart: "กดปุ่มเพื่อเริ่มตอบคำถาม", tryAgain: "ลองอีกครั้ง"
            }
        },
        'en-US': {
            speechRecLang: 'en-US', ttsLang: 'en-US', ttsVoice: 'en-US-Standard-J',
            ui: {
                initialGreeting: "Hello, I'm Mr. Robby AI. Today, we'll talk about \nTopic 2: What time is it? When you're ready, press the button to talk to me.",
                pushToTalk: "Push to Talk", waitingToStart: "Waiting to start conversation", aiIsSpeaking: "AI is speaking...",
                pleaseWait: "Please wait...", errorGeneratingSpeech: "Sorry, there was a problem generating speech.",
                listening: "Listening...", waitingForYou: "Waiting for you to speak...", youSaid: "You said:",
                errorOccurred: "An error occurred:", pressToSpeakAgain: "Press the button to speak again",
                sendingToAI: "Sending response to AI...", connectionError: "Sorry, there was a problem connecting to the AI.",
                finish: "Finish", pressForEvaluation: "Press the button to see the evaluation",
                evaluationResultTitle: "Evaluation Result", lessonFinished: "Lesson finished.",
                question: "Question", pressToStart: "Press the button to start answering", tryAgain: "Try again"
            }
        }
    };

    

    function cleanText(text) {
        return text.replace(/[*#]/g, '');
    }
    
    async function speak(text, onEndCallback = null) {
        const ui = langConfig[currentLanguage.value].ui;
        aiResponse.value = '...';
        status.value = ui.aiIsSpeaking;
        isLoading.value = true;

        try {
            const response = await axios.post('http://localhost:3000/api/tts', {
                text: text,
                languageCode: langConfig[currentLanguage.value].ttsLang,
                voiceName: langConfig[currentLanguage.value].ttsVoice
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
                audioContext.resume();
            }
            
            const decodedBuffer = await audioContext.decodeAudioData(audioBuffer);
            const audioSource = audioContext.createBufferSource();
            
            audioSource.buffer = decodedBuffer;
            audioSource.connect(audioContext.destination);

            aiResponse.value = text;
            audioSource.start(0);

            audioSource.onended = () => {
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
        }
    }

    function setupSpeechRecognition() {
        recognition = new(window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = langConfig[currentLanguage.value].speechRecLang;
        recognition.interimResults = false;

        recognition.onstart = () => {
            status.value = langConfig[currentLanguage.value].ui.listening;
            userInput.value = langConfig[currentLanguage.value].ui.waitingForYou;
        };
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = `${langConfig[currentLanguage.value].ui.youSaid} "${transcript}"`;
            sendToAI(transcript);
        };

        recognition.onerror = (event) => {
            status.value = `${langConfig[currentLanguage.value].ui.errorOccurred} ${event.error}`;
            isLoading.value = false;
        };
        
        recognition.onend = () => {
             status.value = langConfig[currentLanguage.value].ui.pressToSpeakAgain;
             if (status.value !== langConfig[currentLanguage.value].ui.sendingToAI) {
                isLoading.value = false;
             }
        };
    }
    
    async function sendToAI(userText) {
        isLoading.value = true;
        status.value = langConfig[currentLanguage.value].ui.sendingToAI;
        const uix = langConfig[currentLanguage.value].ui;



        try {
            const historyToSend = conversationHistory.value.map(item => ({
                role: item.role,
                parts: item.parts
            }));
            

            const response = await axios.post('http://localhost:3000/api/chat', {
                userMessage: userText,
                history: historyToSend,
                language: currentLanguage.value,
                totalQuestions: totalQuestions
            });
            
            const aiText = cleanText(response.data.reply);


            conversationHistory.value.push({ role: "user", parts: [{ text: userText }] });
            conversationHistory.value.push({ role: "model", parts: [{ text: aiText }] });
           
            if (aiText.includes('EVALUATION:')) {
                const parts = aiText.split('EVALUATION:');
                const preEvaluationText = parts[0].trim();
                evaluationResult.value = parts[1].trim();
                
                speak(preEvaluationText, () => {
                    evaluationVisible.value = true;
                    isLoading.value = false;
                    status.value = langConfig[currentLanguage.value].ui.pressForEvaluation;
                });
                
            } else if (/Q\d+:/.test(aiText)) {
                if (currentQuestionNumber.value < totalQuestions) {
                  currentQuestionNumber.value++;
                }

                const questionOnlyText = aiText.replace(/Q\d+:\s*/, `${uix.question} ${currentQuestionNumber.value}: `);
                speak(questionOnlyText);
            } else {
                speak(aiText);
            }

        } catch (error) { 
            console.error("❌ ERROR in sendToAI():", error);
            status.value = langConfig[currentLanguage.value].ui.connectionError;
            isLoading.value = false;
        } 
    }

    function initializeApp(language) {
        currentLanguage.value = language;
        const ui = langConfig[language].ui;
        
        conversationHistory.value = [
            { role: "model", parts: [{ text: ui.initialGreeting }] }
        ];

        status.value = ui.pressToStart;
        mainLayoutVisible.value = true;
        setupSpeechRecognition();
        speak(ui.initialGreeting);
    }

    function handleTalkButtonClick() {
        if(recognition && !isLoading.value) {
            isLoading.value = true;
            recognition.start();
        }
    }

    function restartLesson(){
        location.reload();
    }

    return {
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
    };
}

