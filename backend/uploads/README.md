# Assignment File Uploads

## File Upload Configuration

### Limits
- **Maximum file size**: 200MB per file
- **Maximum files per submission**: 10 files
- **Supported file types**: All file types accepted

### Storage Location
- Files are stored in: `backend/uploads/assignments/`
- Filename format: `{timestamp}-{userId}-{originalFilename}`

### Security Features
- File size validation (200MB limit)
- File count validation (10 files max)
- Unique filename generation to prevent conflicts
- User authentication required for uploads

### Usage
Students can upload files when submitting assignments with submission types:
- `file` - File uploads only
- `mixed` - Text + Links + Files

### File Management
- Files are automatically organized by upload date
- Original filenames are preserved in database
- File metadata (size, type, path) stored in database
- Admin can view uploaded files in submission reviews