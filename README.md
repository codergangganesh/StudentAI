# 🤖 StudentAI 

A sleek, modern AI-powered chat application built with **pure vanilla JavaScript**, featuring a beautiful UI and powered by Hugging Face's free AI models. No frameworks, no dependencies - just clean, fast code!

![StudentAI Demo](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)

## ✨ Features

- 🎨 **Modern UI Design** - Clean, responsive interface with gradient backgrounds
- 🤖 **AI-Powered Responses** - Uses Microsoft DialoGPT via Hugging Face API
- 🖼️ **Image Support** - Upload and analyze images with AI
- 📱 **Mobile Responsive** - Works perfectly on all devices
- ⚡ **Fast & Lightweight** - No frameworks, pure vanilla JavaScript
- 🎭 **Smooth Animations** - Beautiful slide-in effects and loading states
- 🔒 **Secure** - Client-side only, your API key stays private



## 🛠️ Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **AI Model**: Microsoft DialoGPT-medium
- **API**: Hugging Face Inference API
- **Styling**: Modern CSS with Flexbox & Grid
- **Fonts**: Inter (Google Fonts)

## 📋 Prerequisites

Before you begin, ensure you have:

- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Hugging Face API key (free tier available)
- Basic knowledge of HTML/CSS/JavaScript (for customization)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
# Clone the vanilla JS version
git clone -b vanilla-js-version https://github.com/codergangganesh/StudentAI.git
cd StudentAI

# Or clone and switch to vanilla JS branch
git clone https://github.com/codergangganesh/StudentAI.git
cd StudentAI
git checkout vanilla-js-version
```

### 2. Get Hugging Face API Key

1. Visit [Hugging Face Access Tokens](https://huggingface.co/settings/tokens)
2. Sign up for a free account
3. Create a new access token
4. Copy your API key

### 3. Configure API Key

Open `script.js` and replace the API key on line 8:

```javascript
const HUGGINGFACE_API_KEY = "hf_your-actual-api-key-here"
```

### 4. Run the Application

Simply open `aibot.html` in your web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

## 🎯 Usage

1. **Start Chatting**: Type your message in the input field
2. **Send Message**: Press Enter or click the send button
3. **Upload Images**: Click the image icon to upload and analyze images
4. **View Responses**: AI responses appear with smooth animations

### Example Conversations

```
User: "Explain quantum computing in simple terms"
AI: "Quantum computing uses quantum mechanics principles..."

User: "What's in this image?" + [uploaded image]
AI: "I can see a beautiful sunset over mountains..."
```

## 🔄 Available AI Models

You can switch between different Qwen models by changing line 22 in `script.js`:

```javascript
// Fast and Free (Current)
this.model = "qwen/qwen-2.5-7b-instruct"

// More Capable (May have costs)
this.model = "qwen/qwen-2.5-72b-instruct"

// Alternative Free Option
this.model = "qwen/qwen-2-7b-instruct"
```

## 🎨 Customization

### Changing Colors

Edit the CSS variables in `style.css`:

```css
:root {
    --primary-color: #4f46e5;
    --secondary-color: #7c3aed;
    --background-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Adding New Features

The modular structure makes it easy to add features:

- **New AI Models**: Modify the `OpenRouterAI` class
- **UI Components**: Add new CSS classes and HTML elements
- **Functionality**: Extend the JavaScript event handlers

## 📁 Project Structure

```
StudentAI/
├── aibot.html          # Main HTML file
├── style.css           # Styling and animations
├── script.js           # JavaScript logic and API integration
├── README.md           # Project documentation
└── assets/             # Images and other assets (if any)
```

## 🔍 Code Overview

### Key Components

1. **OpenRouterAI Class** - Handles API communication
2. **Message Handling** - Creates and manages chat bubbles
3. **Image Processing** - Handles file uploads and base64 conversion
4. **UI Animations** - Smooth transitions and loading states

### API Integration

```javascript
class OpenRouterAI {
    constructor(apiKey) {
        this.apiKey = apiKey
        this.model = "qwen/qwen-2.5-7b-instruct"
    }
    
    async generateContent(message, imageData = null) {
        // API call implementation
    }
}
```

## 🐛 Troubleshooting

### Common Issues

**❌ API Error 401 - Unauthorized**
- Check if your API key is correct
- Ensure the key has proper permissions

**❌ API Error 429 - Rate Limited**
- You've exceeded the free tier limits
- Wait a few minutes or upgrade your plan

**❌ No Response from AI**
- Check browser console for errors
- Verify internet connection
- Ensure API key is properly set

**❌ Images Not Working**
- Check if the model supports vision (Qwen models do)
- Ensure image is in supported format (JPG, PNG, WebP)
- Check file size limits

### Debug Mode

Enable detailed logging by opening browser console (F12) to see:
- API request URLs
- Request/response data
- Error details

## 🚀 Deployment

### GitHub Pages

1. Push your code to GitHub
2. Go to repository Settings
3. Enable GitHub Pages
4. Your app will be available at `https://yourusername.github.io/StudentAI`

### Netlify

1. Connect your GitHub repository
2. Deploy automatically on every push
3. Custom domain support available

### Vercel

1. Import your GitHub repository
2. Zero-config deployment
3. Automatic HTTPS and CDN

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test on multiple browsers
- Update README if needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

