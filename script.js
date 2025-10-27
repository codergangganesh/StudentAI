let prompt = document.querySelector("#prompt")
let submitbtn = document.querySelector("#submit")
let chatContainer = document.querySelector(".chat-container")
let imagebtn = document.querySelector("#image")
let imageinput = document.querySelector("#image input")

// Configuration - Replace with your Hugging Face API key
const HUGGINGFACE_API_KEY = "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"  // Get from: https://huggingface.co/settings/tokens

// Hugging Face API Configuration
const API_BASE_URL = "https://api-inference.huggingface.co/models"
const HF_MODEL = "FreedomIntelligence/openPangu-Embedded-1B"  // Free conversational AI model

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
}

// Hugging Face AI class
class HuggingFaceAI {
    constructor(apiKey) {
        this.apiKey = apiKey
        this.model = HF_MODEL
        this.baseUrl = API_BASE_URL
    }

    async generateContent(message, imageData = null) {
        // Check if API key is configured properly
        if (!this.apiKey || this.apiKey === "YOUR_HUGGINGFACE_API_KEY_HERE" || !this.apiKey.startsWith("hf_")) {
            console.warn("Invalid or missing Hugging Face API key")
            return this.getDemoResponse(message)
        }

        try {
            console.log("Using Hugging Face API with key:", this.apiKey.substring(0, 10) + "...")
            return await this.callHuggingFace(message)
        } catch (error) {
            console.error("Hugging Face API Error:", error)
            // Return error message for debugging instead of demo response
            return { 
                text: `❌ API Error: ${error.message}. Please check your API key and model availability.` 
            }
        }
    }

    async callHuggingFace(message) {
        const url = `${this.baseUrl}/${this.model}`
        
        console.log("Hugging Face API Request URL:", url)
        console.log("Request Message:", message)
        console.log("Using Model:", this.model)

        const requestBody = {
            inputs: message,
            parameters: {
                max_new_tokens: 150,
                temperature: 0.7,
                do_sample: true,
                top_p: 0.9,
                repetition_penalty: 1.1
            },
            options: {
                wait_for_model: true,
                use_cache: false
            }
        }

        console.log("Request Body:", JSON.stringify(requestBody, null, 2))

        const response = await fetch(url, {
            method: "POST",
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'StudentAI-ChatBot/1.0'
            },
            body: JSON.stringify(requestBody)
        })

        console.log("Response Status:", response.status)
        console.log("Response Headers:", Object.fromEntries(response.headers.entries()))

        if (!response.ok) {
            const errorText = await response.text()
            console.error("API Error Response:", errorText)
            
            // Handle specific error cases
            if (response.status === 401) {
                throw new Error("Invalid API key. Please check your Hugging Face token.")
            } else if (response.status === 503) {
                throw new Error("Model is currently loading. Please try again in a few moments.")
            } else if (response.status === 429) {
                throw new Error("Rate limit exceeded. Please wait a moment before trying again.")
            } else {
                throw new Error(`API Error ${response.status}: ${errorText}`)
            }
        }

        const data = await response.json()
        console.log("API Response:", data)

        // Handle different response formats
        let responseText = ""
        
        if (Array.isArray(data) && data.length > 0) {
            // Handle array response
            const firstResult = data[0]
            responseText = firstResult.generated_text || firstResult.text || firstResult.output_text || ""
        } else if (data.generated_text) {
            // Handle single object with generated_text
            responseText = data.generated_text
        } else if (data.text) {
            // Handle single object with text
            responseText = data.text
        } else if (data.output_text) {
            // Handle single object with output_text
            responseText = data.output_text
        } else if (typeof data === 'string') {
            // Handle direct string response
            responseText = data
        }

        // Clean up the response
        if (responseText) {
            // Remove input text if it's repeated at the beginning
            if (responseText.toLowerCase().startsWith(message.toLowerCase())) {
                responseText = responseText.substring(message.length).trim()
            }
            
            // Remove common prefixes
            responseText = responseText.replace(/^(AI:|Assistant:|Bot:)/i, '').trim()
            
            // Ensure we have some content
            if (!responseText || responseText.length < 3) {
                responseText = "I understand your message. Could you please provide more details so I can help you better?"
            }
        } else {
            responseText = "I'm here to help! Could you please rephrase your question?"
        }

        return { text: responseText }
    }

    getDemoResponse(message) {
        const demoResponses = [
            "I'm a demo AI assistant. To get real AI responses, please add your Hugging Face API key!",
            "Hello! I'm running in demo mode. Add your Hugging Face API key for full functionality.",
            "I'd love to help you with that! Please configure your Hugging Face API key to enable AI responses.",
            "This is a demo response. Get your free API key from Hugging Face to chat with real AI!",
            "I'm currently in demo mode. Add your API key to unlock full AI capabilities!",
            `You asked: "${message}" - I'm in demo mode. Add your API key for real responses!`
        ]
        
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
        return { text: randomResponse }
    }
}

// Initialize AI instance
const ai = new HuggingFaceAI(HUGGINGFACE_API_KEY)

// Validate API key on page load
function validateApiKey() {
    const hasHuggingFace = HUGGINGFACE_API_KEY && HUGGINGFACE_API_KEY !== "YOUR_HUGGINGFACE_API_KEY_HERE" && HUGGINGFACE_API_KEY.startsWith("hf_")
    
    if (!hasHuggingFace) {
        const warningMessage = `
            <div class="ai-chat-box">
                <div class="message-avatar">
                    <div class="ai-icon">⚠️</div>
                </div>
                <div class="ai-chat-area">
                    <div class="message-content" style="color: #f59e0b;">
                        <strong>Hugging Face API Key Required!</strong><br>
                        Please add your API key in script.js line 8:<br><br>
                        
                        <strong>🤗 Hugging Face (Free):</strong><br>
                        • Get free key: <a href="https://huggingface.co/settings/tokens" target="_blank">HF Access Tokens</a><br>
                        • Free tier: 30,000 characters/month<br>
                        • Current model: ${HF_MODEL}<br><br>
                        
                        <small>💡 You can still try the demo mode below!</small>
                    </div>
                </div>
            </div>
        `
        chatContainer.innerHTML = warningMessage
        return false
    } else {
        // Show success message with current model
        const successMessage = `
            <div class="ai-chat-box">
                <div class="message-avatar">
                    <div class="ai-icon">🤖</div>
                </div>
                <div class="ai-chat-area">
                    <div class="message-content">
                        Hi! I'm your AI assistant powered by <strong>${HF_MODEL}</strong>. How can I help you today?
                    </div>
                </div>
            </div>
        `
        chatContainer.innerHTML = successMessage
    }
    return true
}

// Check API key when page loads
document.addEventListener('DOMContentLoaded', validateApiKey)

async function generateResponse(aiChatBox) {
    let messageContent = aiChatBox.querySelector(".message-content")

    try {
        // Generate response using Hugging Face AI
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
prompt.addEventListener("touchstart", () => {
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