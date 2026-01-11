# PhysicsFighter Academy 🚀

![Project Status](https://img.shields.io/badge/Status-Active_Development-neon_cyan)
![Next.js](https://img.shields.io/badge/Next.js-14.1-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)

**PhysicsFighter Academy** is a cutting-edge educational platform designed to make learning physics an immersive, gamified experience. Built with a modern tech stack and styled with a distinct "Cyberpunk" aesthetic, this project pushes the boundaries of educational web applications.

## 🛠 Tech Stack

This project leverages the latest web technologies to deliver a high-performance, responsive, and visually stunning experience.

### **Core Framework & Language**
-   **[Next.js 14](https://nextjs.org/)**: React framework for production, utilizing the App Router for seamless navigation and server-side rendering.
-   **[TypeScript](https://www.typescriptlang.org/)**: Ensures type safety and code quality across the entire codebase.
-   **[React 18](https://react.dev/)**: The library for web and native user interfaces.

### **Styling & UI Components**
-   **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework for rapid UI development.
    -   *Custom Cyberpunk Theme*: Bespoke color palette including neon cyan (#00FFF0), magenta (#FF00FF), and deep space backgrounds.
-   **[Radix UI](https://www.radix-ui.com/)**: Unstyled, accessible components for building high-quality design systems (Dialogs, Dropdowns, Slots).
-   **[Lucide React](https://lucide.dev/)**: Beautiful & consistent icon pack.
-   **[Class Variance Authority (CVA)](https://cva.style/)**: For creating type-safe UI component variants.
-   **[Tailwind Merge](https://github.com/dcastil/tailwind-merge)** & **[Clsx](https://github.com/lukeed/clsx)**: Efficient class name merging and conditional styling.

### **State Management & Utilities**
-   **[Zustand](https://github.com/pmndrs/zustand)**: A small, fast, and scalable bearbones state-management solution.
-   **[Date-fns](https://date-fns.org/)**: Modern JavaScript date utility library.
-   **[Sonner](https://sonner.emilkowal.ski/)**: An opinionated toast component for React.

### **Backend & Services**
-   **[Firebase](https://firebase.google.com/)**:
    -   **Authentication**: Secure user login and management.
    -   **Firestore**: NoSQL cloud database for real-time data syncing.
    -   **Storage**: Cloud storage for assets and user uploads.

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites
-   Node.js 18+ installed
-   npm or yarn or pnpm

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/physics-fighter-academy.git
    cd physics-fighter-academy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory and add your Firebase configuration keys:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
physics-fighter-academy/
├── app/                 # Next.js App Router pages and layouts
├── components/          # Reusable UI components
│   ├── ui/              # Radix/Shadcn-like primitive components
│   └── ...
├── lib/                 # Utility functions and configurations
├── public/              # Static assets
└── types/               # TypeScript type definitions
```

## ✨ Features

-   **Student Zone**: Interactive learning modules.
-   **Cyberpunk UI**: Immersive dark mode design with neon accents.
-   **Real-time Progress**: Track learning through Firebase Firestore.
-   **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile.

---

Built with ❤️ by the PhysicsFighter Academy Team.
