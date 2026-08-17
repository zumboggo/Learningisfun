# Secure Appwrite functions

`functions/learning-content` validates authenticated writes and class membership. `functions/writing-ai-feedback` keeps the OpenRouter credential server-side.

Deploy both in Appwrite and allow authenticated-user execution. Configure `VITE_APPWRITE_FN_LEARNING_CONTENT` and `VITE_APPWRITE_FN_WRITING_AI_FEEDBACK` in the web build. Function variables are `APPWRITE_ENDPOINT`, `APPWRITE_API_KEY`, `APPWRITE_DATABASE_ID`, and, for AI, `OPENROUTER_API_KEY` plus optional `OPENROUTER_MODEL`.

After deployment and data migration, remove direct create/update/delete permissions from the feature collections. Do not remove them first or existing clients cannot drain their offline queues.
