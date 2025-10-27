let prompt = document.querySelector("#prompt")
let submitbtn = document.querySelector("#submit")
let chatContainer = document.querySelector(".chat-container")
let imagebtn = document.querySelector("#image")
let imageinput = document.querySelector("#image input")

// Configuration - Replace with your OpenRouter API key
const OPENROUTER_API_KEY = "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"
const API_BASE_URL = "https://openrouter.ai/api/v1"

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
}

// OpenRouter AI class with Qwen model
class OpenRouterAI {
    constructor(apiKey) {
        this.apiKey = apiKey
        // Available Qwen models on OpenRouter (free tier):
        // "qwen/qwen-2.5-7b-instruct" - Fast and free
        // "qwen/qwen-2-7b-instruct" - Alternative free option
        // "qwen/qwen-2.5-72b-instruct" - More capable (may have costs)
        this.model = "qwen/qwen-2.5-7b-instruct"
    }

    async generateContent(message, imageData = null) {
        const url = `${API_BASE_URL}/chat/completions`

        // Prepare messages array
        const messages = [
            {
                role: "user",
                content: imageData ? [
                    { type: "text", text: message },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:${imageData.mime_type};base64,${imageData.data}`
                        }
                    }
                ] : message
            }
        ]

        const requestBody = {
            model: this.model,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            stream: false
        }

        console.log("OpenRouter API Request URL:", url)
        console.log("Request Body:", JSON.stringify(requestBody, null, 2))

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Chat Bot'
            },
            body: JSON.stringify(requestBody)
        })

        console.log("Response Status:", response.status)

        if (!response.ok) {
            const errorText = await response.text()
            console.error("API Error Response:", errorText)
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json()
        console.log("API Response:", data)

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from API")
        }

        return {
            text: data.choices[0].message.content
        }
    }
}

// Initialize AI instance
const ai = new OpenRouterAI(OPENROUTER_API_KEY)

// Validate API key on page load
function validateApiKey() {
    if (OPENROUTER_API_KEY === "YOUR_OPENROUTER_API_KEY_HERE" || !OPENROUTER_API_KEY) {
        const warningMessage = `
            <div class="ai-chat-box">
                <div class="message-avatar">
                    <div class="ai-icon">⚠️</div>
                </div>
                <div class="ai-chat-area">
                    <div class="message-content" style="color: #f59e0b;">
                        <strong>OpenRouter API Key Required!</strong><br>
                        Please update your OpenRouter API key in script.js line 8.<br>
                        Get your free key at: <a href="https://openrouter.ai/keys" target="_blank">OpenRouter Dashboard</a><br>
                        <small>Using Qwen 2.5-7B model for free text generation</small>
                    </div>
                </div>
            </div>
        `
        chatContainer.innerHTML = warningMessage
        return false
    }
    return true
}

// Check API key when page loads
document.addEventListener('DOMContentLoaded', validateApiKey)

async function generateResponse(aiChatBox) {
    let messageContent = aiChatBox.querySelector(".message-content")

    try {
        // Generate response using OpenRouter AI with Qwen model
        const imageData = user.file.data ? {
            mime_type: user.file.mime_type,
            data: user.file.data
        } : null

        const response = await ai.generateContent(user.message, imageData)

        // Format and display response
        const apiResponse = response.text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            .trim()

        messageContent.innerHTML = apiResponse

    } catch (error) {
        console.error("AI Response Error:", error)
        messageContent.innerHTML = `
            <div style="color: #ef4444;">
                ❌ Error: ${error.message || "Failed to get response. Please check your API key and try again."}
            </div>
        `
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" })
        // Reset image button
        let imageBtn = document.querySelector("#image")
        imageBtn.style.background = "linear-gradient(135deg, #6b7280, #4b5563)"
        imageBtn.title = "Upload Image"
        user.file = { mime_type: null, data: null }
    }
}



function createChatBox(html, classes) {
    let div = document.createElement("div")
    div.innerHTML = html
    div.classList.add(classes)
    return div
}


function handlechatResponse(userMessage) {
    // Validate input
    if (!userMessage || userMessage.trim() === "") {
        alert("Please enter a message!")
        return
    }

    user.message = userMessage.trim()
    let html = `<div class="message-avatar">
        <div class="user-avatar-icon">👤</div>
    </div>
    <div class="user-chat-area">
        <div class="message-content">
            ${user.message}
            ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
        </div>
    </div>`
    prompt.value = ""
    let userChatBox = createChatBox(html, "user-chat-box")
    chatContainer.appendChild(userChatBox)

    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" })

    setTimeout(() => {
        let html = `<div class="message-avatar">
            <div class="ai-icon">🤖</div>
        </div>
        <div class="ai-chat-area">
            <div class="message-content">
                <div class="loading-dots"></div>
            </div>
        </div>`
        let aiChatBox = createChatBox(html, "ai-chat-box")
        chatContainer.appendChild(aiChatBox)
        generateResponse(aiChatBox)
    }, 600)
}


prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault()
        handlechatResponse(prompt.value)
    }
})

// Mobile-specific: Handle input focus for better UX
prompt.addEventListener("focus", () => {
    // Scroll to input on mobile when focused
    setTimeout(() => {
        prompt.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 300)
})

// Prevent zoom on input focus (iOS Safari)
prompt.addEventListener("touchstart", (e) => {
    if (prompt.style.fontSize !== "16px") {
        prompt.style.fontSize = "16px"
    }
})
submitbtn.addEventListener("click", () => {
    handlechatResponse(prompt.value)
})
imageinput.addEventListener("change", () => {
    const file = imageinput.files[0]
    if (!file) return
    let reader = new FileReader()
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1]
        user.file = {
            mime_type: file.type,
            data: base64string
        }
        // Change button color to indicate image is selected
        let imageBtn = document.querySelector("#image")
        imageBtn.style.background = "linear-gradient(135deg, #10b981, #059669)"
        imageBtn.title = `Image selected: ${file.name}`
    }
    reader.readAsDataURL(file)
})


imagebtn.addEventListener("click", () => {
    imagebtn.querySelector("input").click()
})