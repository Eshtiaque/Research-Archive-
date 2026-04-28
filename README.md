# Research Archive 📚🧬
**An AI-Powered Academic Research Assistant & Topology Visualizer**

Research Archive is a modern academic platform designed to help researchers discover, analyze, and visualize scientific literature. By leveraging advanced AI and network graph technologies, it allows users to understand complex connections between papers and datasets in a seamless interface.

## 🚀 Key Features
- **AI-Powered Synthesis:** Deep analysis of research papers using LangChain and Llama-3.1 (Groq API).
- **Interactive Topology:** Dynamic mapping of paper-to-dataset relationships using `react-force-graph`.
- **System Architecture Dashboard:** A real-time visualization of the platform's internal logic and data flow built with `React Flow`.
- **Academic Indexing:** Direct integration with the OpenAlex API for access to millions of scholarly works.
- **Secure Authentication:** User identity management and protected routes powered by Clerk.
- **Quota & Analytics:** Integrated credit system for AI usage and user workspace management.

## 🛠️ Tech Stack
- **Frontend:** React.js, Tailwind CSS, Vite, React Flow, React-Force-Graph.
- **Backend:** Node.js, Express.js.
- **AI Engine:** LangChain, Groq (Llama-3.1-8b).
- **Database:** MongoDB Atlas (NoSQL).
- **Auth:** Clerk.
- **Deployment:** Vercel (Backend), Netlify (Frontend).

## 📂 Project Structure
This project is organized as a monorepo for easier management of both client and server:

```text
Research-Assistant/
├── research-assistant/           # Frontend (React + Vite)
├── research-archive-backend/     # Backend Root
│   └── node-server/              # Main Express Server
│       ├── server.js             # Entry Point
│       ├── vercel.json           # Vercel Configuration
│       └── src/                  # Controllers, Routes, Models, Config
└── README.md
```

## ⚙️ Local Development

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd Research-Assistant
```

### 2. Backend Setup
```bash
cd research-archive-backend/node-server
npm install
```
Create a `.env` file in `node-server/` and add:
- `PORT=5000`
- `MONGO_URI=your_mongodb_connection_string`
- `GROQ_API_KEY=your_groq_api_key`
- `CLERK_SECRET_KEY=your_clerk_secret_key`

Start the server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../../research-assistant
npm install
```
Create a `.env` file in `research-assistant/` and add:
- `VITE_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key`
- `VITE_API_URL=http://localhost:5000`

Run the development server:
```bash
npm run dev
```


---
**Developed with ❤️ by [Eshtiaque Ahmed]**
```