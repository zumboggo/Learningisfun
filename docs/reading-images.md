# Pictures in readings

The Add text and Edit text editors preserve images and figure captions from pasted HTML. Enter the original article URL before pasting when a source uses relative picture links. PNG, JPEG, GIF and WebP pictures can also be pasted from the clipboard or inserted with **Add picture** at the cursor. DOCX imports preserve embedded pictures too; PDF extraction is unchanged.

Saving copies each distinct image to private Appwrite storage (5 MB per picture). It replaces image URLs/data with durable `reading-image:<textId>:<fileId>` references. Images remain within their original paragraph or figure block. For readings with student annotations, picture edits that change the paragraph count are blocked; insert the picture within an existing paragraph instead. Captions stay editable as text. Blocked, missing or unsupported images prevent saving and leave the editor content intact, with instructions to upload a copy or remove the image entry. Source sites requiring login or blocking downloads may require manual upload. Remote imports require HTTPS.

Students see responsive images within the existing reading, fullscreen and presentation views. Image access is checked against the reading's owner, class assignment/release, or explicit public-sharing setting; a file must be referenced in that reading. Storage remains private. A five-minute file token is issued only after authorization. Public sharing revocation prevents new tokens; existing tokens expire within five minutes. Tokens are never stored in reading content. Repeated imports deduplicate by teacher and image content. Removed/abandoned pictures are retained; no existing files are deleted.

## Deployment

1. Run `node --env-file=<admin-env-file> scripts/setup-reading-image-storage.mjs` to enable picture extensions in the existing private reading-file bucket.
2. Run `node --env-file=<admin-env-file> scripts/deploy-reading-images.mjs` and verify both deployments become ready using the same command with `--status`. This preserves the functions’ existing settings.
3. Deploy the frontend through the existing GitHub Pages workflow.

Backend downloads reject non-public IPs and unsafe schemes/ports, pin DNS results to the actual connection, revalidate redirects, bound response size/time, and verify raster signatures. Uploads require the teacher role. File reads verify access and that the image belongs to the reading's teacher and appears in its current paragraphs.
