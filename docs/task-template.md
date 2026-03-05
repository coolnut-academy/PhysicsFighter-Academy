# AI Development Task Template

Below is the full project documentation.

[PASTE full-doc.md HERE]

Below is the project file map.

[PASTE file-map.md HERE]

---

# Task

Describe the feature, bug fix, or change.

Example:
Add a secure user profile page that allows editing name and avatar within the `app/profile/` directory. Be sure to link the state to `useAuthStore.ts` and ensure Firebase Storage properly handles the avatar image.

---

# Constraints

* Follow the existing architecture (Serverless + JAMstack logic).
* Modify only necessary files. 
* Do not rewrite the entire project framework.
* Ensure code leverages existing Shadcn UI/Radix styles found in `src/components/ui/`.
* Stick rigidly to the types in `src/types/index.ts`.

---

# Output Format

Return only:

1. Files that must be modified.
2. Full code for those files.
3. Short explanation of changes.

---

# Optimization Rules

* Avoid regenerating unchanged files.
* Reuse existing components and utilities instead of building redundant components.
* Keep responses minimal. Do NOT summarize obvious code chunks.
* Maintain coding conventions (functional components, Tailwind CSS styling logic).

---

# Important Output Rule

When requesting changes, strictly limit your response to updating the direct dependencies related to the requested task. Make sure code files are provided in raw fenced-code blocks formatted tightly.
