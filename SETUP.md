# Physics Fighter Academy - Setup Guide

## 🚀 Quick Setup Commands

Run these commands in order:

```bash
# 1. Initialize Next.js 14 (if not already done)
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# 2. Install core dependencies
npm install firebase zustand lucide-react date-fns

# 3. Install Shadcn UI
npx shadcn-ui@latest init

# When prompted, use these settings:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
# - TypeScript: Yes

# 4. Install Shadcn components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add table
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add alert

# 5. Install additional utilities
npm install clsx tailwind-merge class-variance-authority

# 6. Create environment file
cp .env.example .env.local
```

## 📁 Project Structure

```
PhysicsFighter-Academy/
├── app/
│   ├── (auth)/                    # Auth pages (login, register)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── (student)/                 # Student-only routes
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   └── [courseId]/
│   │   │       └── page.tsx
│   │   ├── my-courses/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── admin/                     # Admin (Instructor) routes
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [courseId]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── revenue/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── super-admin/               # Super Admin routes
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   ├── courses/
│   │   │   └── page.tsx
│   │   ├── payments/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   │
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Landing page
│   └── globals.css
│
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── guards/
│   │   │   └── RoleGuard.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── shared/
│   │       └── Loading.tsx
│   │
│   ├── store/
│   │   └── useAuthStore.ts
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts
│   │   │   ├── auth.ts
│   │   │   └── firestore.ts
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useRole.ts
│   │
│   └── types/
│       └── index.ts               # Already created
│
├── public/
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── firestore.rules                # Already created
└── package.json
```

## 🔐 Environment Variables

Add to `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🎨 Theme

Modern Cyberpunk with:
- Dark backgrounds
- Neon Cyan (#00FFF0) primary
- Neon Magenta (#FF00FF) accent
- Deep purple/black backgrounds
- Glassmorphism effects

## 📦 Next Steps

1. Run the setup commands above
2. Configure Firebase in `.env.local`
3. Deploy Firestore rules: `firebase deploy --only firestore:rules`
4. Start dev server: `npm run dev`
