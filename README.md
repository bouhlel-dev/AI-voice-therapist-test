
# AI Therapist

An interactive **AI-based therapist application** that provides a simple chat interface for mental-health conversations.
Built with **React + Vite** for the frontend and Python for speech and text processing.

![Screenshot](https://github.com/NimishKatara/therapist/blob/main/assets/AenhD0j78CmJ8laSsmwtLVdY00.avif?raw=true)

---

## Features

* Real-time chat interface with AI responses
* Text-to-speech (TTS) and speech-to-text (STT) support
* Audio input and output for natural interaction
* Supabase integration for data handling

---

## Project Structure

| File / Folder                | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `src/`                       | React components (`chatbutton.jsx`, `chatwindow.jsx`, etc.) |
| `app.py`, `stt.py`, `tts.py` | Backend Python scripts for AI processing                    |
| `public/`                    | Static assets                                               |
| `supabase.js`                | Database connection                                         |
| `vite.config.js`             | Vite configuration                                          |
| `package.json`               | Frontend dependencies                                       |
| `.env`                       | Environment variables                                       |

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v14 or above)
* Python 3.8+
* A Supabase account (for database services)

### Installation

```bash
git clone <repo-url>
cd therapist
npm install
npm run dev
```

Run the Python backend:

```bash
pip install -r requirements.txt
python app.py
```

---

## Usage

* Start the frontend with `npm run dev`
* Run the Python backend with `python app.py`
* Open the local URL shown in the terminal to begin chatting with the AI therapist.

