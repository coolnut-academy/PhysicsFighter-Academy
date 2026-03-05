```text
app/
├ (student)/
├ admin/                 
│  ├ courses/            
│  ├ dashboard/          
│  ├ payments/           
│  ├ revenue/            
│  └ settings/           
├ checkout/              
├ courses/               
├ dashboard/             
├ learn/                 
├ login/                 
├ my-courses/            
├ my-enrollments/        
├ profile/               
├ register/              
└ super-admin/           
src/
├ components/
│  ├ admin/              
│  ├ auth/               
│  ├ courses/            
│  ├ enrollment/         
│  ├ guards/             
│  ├ layout/             
│  ├ mobile/             
│  ├ pwa/                
│  ├ shared/             
│  └ ui/                 
├ hooks/
├ lib/
│  ├ firebase/
│  └ utils.ts
├ store/
│  └ useAuthStore.ts
└ types/
   └ index.ts
```

### Important Files Directory:

* **app/layout.tsx** → The main Next.js HTML wrapper containing global contexts, PWA meta tags, and font definitions.
* **src/types/index.ts** → The single source of truth for all complex TypeScript interfaces (User, Course, Enrollment, PaymentSlip). **MUST READ before editing database shapes.**
* **src/store/useAuthStore.ts** → The Zustand state manager defining global `user` data and `auth` loading state across the app.
* **src/lib/firebase/** → Firebase initialization files exporting pre-configured `db`, `auth`, and `storage` modules.
* **src/lib/utils.ts** → Core utility functions (ex: tailwind class merging `cn()`).
* **src/components/guards/** → HOC wrappers maintaining strict access controls (e.g., stopping Students from reading `/admin`).
