
(function () {
    const script = document.createElement("script");
    script.src = "https://cdn.enable.co.il/licenses/enable-L407982omp8qahbj-0425-69884/init.js";
    script.async = true;
    document.head.appendChild(script);
})();


const responseElement = document.getElementById("response");
const textarea = document.getElementById("user-input");
textarea.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault(); // למנוע ירידת שורה
        askQuestion();
    }
});


async function askQuestion() {
    const question = document.getElementById("user-input").value;
    const category = document.getElementById("disability-select").value || "כללי";
    const website = document.getElementById("website-select").value;
    const copyButtons = document.getElementById("copy-buttons");
    copyButtons.classList.remove("visible");
    copyButtons.style.display = "none";

    if (!question.trim()) {
        responseElement.textContent = "אנא הכנס/י שאלה.";
        return;
    }

    // הצגת העיגול
    loaderContainer.style.display = "block";
    responseElement.textContent = ""; // ריקון התשובה הקודמת

    try {
        const response = await fetch("/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question, category, website }),
        });

        const data = await response.json();

        loaderContainer.style.display = "none";

        if (data.answer) {
            updateCopyButtonsVisibility(question, data.answer);

        } else {
            updateCopyButtonsVisibility(question, null);
        }

    } catch (error) {
        loaderContainer.style.display = "none";
        responseElement.textContent = "An error occurred while sending the question.";
    }

    textarea.value = "";
}

const loaderContainer = document.getElementById("loader-container");


async function askSpecificQuestion(prompt) {
    // הצגת העיגול
    loaderContainer.style.display = "block";
    responseElement.textContent = ""; // ריקון התשובה הקודמת

    try {
        const response = await fetch("/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question: prompt }),
        });

        const data = await response.json();

        // הסתרת העיגול
        loaderContainer.style.display = "none";

        if (data.answer) {
            updateCopyButtonsVisibility(question, data.answer);


        } else {
            updateCopyButtonsVisibility(question, null);
        }
    } catch (error) {
        // הסתרת העיגול במקרה של שגיאה
        loaderContainer.style.display = "none";
        responseElement.textContent = "An error occurred while sending the question.";
    }
}

function whoAmI() {
    loaderContainer.style.display = "none";

    const website = document.getElementById("website-select").value || "כל זכות";
    const category = document.getElementById("disability-select").value || "כללי";

    let responseText = "אני סייען דיגיטלי מומחה לזכויות, ";

    if (website === "כל זכות" && category === "כללי") {
        responseText += `המשלב ידע מאתר ${website}`;
    } else {
        responseText += ` המשלב ידע מאתר ${website}`;
        if (category !== "כללי") {
            responseText += `, ובעל מומחיות מיוחדת בתחום ${category}`;
        }
    }

    const question = "מי אני";
    updateCopyButtonsVisibility(question, responseText);

    speakText(responseText); // הקראה קולית במידת הצורך
}


function readAloud() {
    const text = document.getElementById("response").innerText;
    if (text.trim() === "") {
        alert("אין טקסט להקראה.");
        return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "he-IL";  // עברית
    speechSynthesis.speak(utterance);
}

function stopReading() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
}

function toggleContrast() {
    document.body.classList.toggle("high-contrast");
}

function setActiveButton(clickedButton) {
    const buttons = document.querySelectorAll("#button-container button");
    buttons.forEach(button => button.classList.remove("active-button"));
    clickedButton.classList.add("active-button");
}

function copyToClipboard() {
    const responseText = document.getElementById("response").innerText;

    if (responseText.trim() === "") {
        alert("אין תוכן להעתיק");
        return;
    }

    // יצירת אלמנט טקסט זמני להעתקה
    const tempInput = document.createElement("textarea");
    tempInput.value = responseText;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand("copy");
    document.body.removeChild(tempInput);

    alert("התשובה הועתקה ");
}

async function loadDisabilityCategories() {
    try {
        const response = await fetch("/static/js/disability_categories.json");
        const data = await response.json();
        const select = document.getElementById("disability-select");

        // ניקוי קודם, אם נטען כבר
        select.innerHTML = "";

        data.categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.name;
            option.textContent = category.name;

            // קובעים את "כללי" כברירת מחדל
            if (category.name.trim() === "כללי") {
                option.selected = true;
            }

            select.appendChild(option);
        });
    } catch (err) {
        console.error("שגיאה בטעינת הקטגוריות:", err);
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("disability-select");

    // הקראה בזמן שינוי הבחירה
    select.addEventListener("change", () => {
        const selectedOption = select.options[select.selectedIndex].text;
        speakText("נבחר התחום: " + selectedOption);
    });

    // הקראה כשעוברים עם טאב
    select.addEventListener("focus", () => {
        const selectedOption = select.options[select.selectedIndex].text;
        speakText("בחר תחום. כרגע מסומן: " + selectedOption);
    });

    // הקראה כאשר מזיזים את העכבר על התיבה
    select.addEventListener("mousemove", (e) => {
        const hoveredIndex = Array.from(select.options).findIndex(option => {
            const rect = option.getBoundingClientRect();
            return e.clientY >= rect.top && e.clientY <= rect.bottom;
        });

        if (hoveredIndex >= 0) {
            const hoveredOption = select.options[hoveredIndex].text;
            if (hoveredOption !== select.getAttribute("data-last-spoken")) {
                speakText(hoveredOption);
                select.setAttribute("data-last-spoken", hoveredOption);
            }
        }
    });

    // איפוס לזיהוי חוזר אם יוצאים מהתיבה
    select.addEventListener("mouseleave", () => {
        select.removeAttribute("data-last-spoken");
    });
});

function speakText(text) {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "he-IL";
    speechSynthesis.speak(utterance);
}

document.addEventListener("DOMContentLoaded", () => {
    // כפתורי תפריט עליון
    document.querySelectorAll(".who-am-i").forEach(button => {
        button.addEventListener("focus", () => speakText(button.innerText));
        button.addEventListener("mouseenter", () => speakText(button.innerText));
    });

    const stopButton = document.querySelector('button[onclick="stopReading()"]');
    stopButton.addEventListener("focus", () => speakText("עצור הקראה"));
    stopButton.addEventListener("mouseenter", () => speakText("עצור הקראה"));

    // תיבת בחירה של מוגבלויות
    const select = document.getElementById("disability-select");
    select.addEventListener("focus", () => speakText("בחר תחום"));

    select.addEventListener("change", () => {
        const selectedOption = select.options[select.selectedIndex].text;
        speakText("נבחר התחום: " + selectedOption);
    });

    // תיבת בחירה של אתרים
    const web_select = document.getElementById("website-select");
    web_select.addEventListener("focus", () => speakText("בחר אתר"));

    web_select.addEventListener("change", () => {
        const webselectedOption = web_select.options[web_select.selectedIndex].text;
        speakText("נבחר האתר: " + webselectedOption);
    });

    // כפתור העתק
    const copyButton = document.querySelector('button.copy-button:nth-of-type(1)');
    copyButton.addEventListener("focus", () => speakText("העתק תשובה"));
    copyButton.addEventListener("mouseenter", () => speakText("בעתק תשובה"));

    // כפתור הקראה
    const readButton = document.querySelector('button.copy-button:nth-of-type(2)');
    readButton.addEventListener("focus", () => speakText("הקרא תשובה"));
    readButton.addEventListener("mouseenter", () => speakText("הקרא תשובה"));

    // שדה טקסט
    const textarea = document.getElementById("user-input");
    textarea.addEventListener("focus", () => speakText("הקלד את שאלתך כאן"));
    //textarea.addEventListener("mouseenter", () => speakText("הקלד את שאלתך כאן"));

    // כפתור שלח
    const sendButton = document.querySelector('button[onclick="askQuestion()"]');
    sendButton.addEventListener("focus", () => speakText("שלח"));
    sendButton.addEventListener("mouseenter", () => speakText("שלח"));

    const micButton = document.getElementById("mic-button");
    micButton.addEventListener("focus", () => speakText("הקש על מנת לדבר"));
    micButton.addEventListener("mouseenter", () => speakText("הקש על מנת לדבר"));
});

// טריק להפעלת המנוע בהקלקה ראשונה
document.addEventListener("click", function once() {
    const dummy = new SpeechSynthesisUtterance(" ");
    dummy.lang = "he-IL";
    speechSynthesis.speak(dummy);
    document.removeEventListener("click", once);
});


//תמלול השיחה והקלדתה בזמן שיחה למיקרופון
const micButton = document.getElementById("mic-button");
const userInput = document.getElementById("user-input");

let recognition;
let recognizing = false;

// בדיקה אם הדפדפן תומך בזיהוי קולי
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
        recognizing = true;
        micButton.innerText = "🎙️ מקשיב...";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value += (userInput.value ? " " : "") + transcript;
    };

    recognition.onerror = (event) => {
        console.error("שגיאה בזיהוי קולי:", event.error);
    };

    recognition.onend = () => {
        recognizing = false;
        micButton.innerText = "🎤 הקש להכתבה";
    };

    micButton.addEventListener("click", () => {
        if (recognizing) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
} else {
    micButton.disabled = true;
    micButton.title = "הדפדפן שלך לא תומך בזיהוי קולי";
}

//בחירת אתר ממנו נלקחות הזכויות
async function loadWebsiteCategories() {
    try {
        const response = await fetch("/static/js/website_categories.json");
        const data = await response.json();
        const select = document.getElementById("website-select");

        data.categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.name;
            option.textContent = category.name;

            // קובעים את "כל זכות" כברירת מחדל
            if (category.name.trim() === "כל זכות") {
                option.selected = true;
            }

            select.appendChild(option);
        });
    } catch (err) {
        console.error("שגיאה בטעינת אתרים:", err);
    }
}
window.onload = () => {
    loadWebsiteCategories();
    loadDisabilityCategories();
};

function toggleAccessibilityPanel() {
    const chatPanel = document.getElementById("chat-container");
    chatPanel.classList.toggle("active");
}

function updateCopyButtonsVisibility(question, answer) {
    const responseBox = document.getElementById("response");
    const copyButtons = document.getElementById("copy-buttons");

    if (answer) {
        responseBox.innerHTML = `
            <span class='question'>${question}</span><br>
            <span class='answer'>${answer}</span>`;
        responseBox.classList.add("has-content");
        responseBox.classList.remove("empty");
        copyButtons.classList.add("visible");
        copyButtons.style.display = "flex";

    } else {
        responseBox.innerHTML = "";
        responseBox.classList.remove("has-content");
        responseBox.classList.add("empty");
        copyButtons.classList.remove("visible");
        copyButtons.style.display = "none";  // ← להשלים גם כאן
    }
}

