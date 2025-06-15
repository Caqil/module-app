# S3 Storage Manager Plugin

A comprehensive AWS S3 storage integration plugin that provides file management, upload/download capabilities, and storage analytics for your application.

## 🚀 Features

- ✅ **Complete S3 Integration** - Upload, download, delete, and list files
- ✅ **Admin Interface** - Full-featured file manager with drag & drop uploads
- ✅ **Dashboard Widgets** - Real-time storage statistics and recent uploads
- ✅ **Security Focused** - Configurable permissions and file type restrictions
- ✅ **Flexible Storage** - Customizable folder structures and naming
- ✅ **Performance Optimized** - Efficient file handling and caching
- ✅ **Production Ready** - Error handling, logging, and monitoring

## 📋 Requirements

- AWS S3 bucket
- AWS credentials (Access Key ID and Secret Access Key)
- Node.js 18+
- Next.js 14+

## 🔧 Installation

1. **Upload the Plugin**

   ```bash
   # Create ZIP file
   zip -r s3-storage.zip . -x "*.DS_Store" "README.md"
   ```

2. **Install via Admin Interface**

   - Go to Admin → Plugins → Install Plugin
   - Upload the `s3-storage.zip` file
   - Activate the plugin

3. **Configure AWS Credentials**
   - Go to Admin → S3 Settings
   - Enter your AWS credentials and bucket details

## ⚙️ Configuration

### Basic Setup

1. **AWS S3 Bucket**

   - Create an S3 bucket in AWS Console
   - Note the bucket name and region

2. **AWS IAM User**

   - Create an IAM user with programmatic access
   - Attach the policy below for minimum required permissions

3. **Plugin Configuration**
   - Navigate to Admin → S3 Settings
   - Enter your credentials and test the connection

### Required AWS Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

### Environment Variables

For security, you can configure the plugin using environment variables:

```bash
# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1

# S3 Configuration
S3_BUCKET_NAME=your-bucket-name
S3_ENABLED=true
S3_PUBLIC_READ=false
S3_MAX_FILE_SIZE=10
S3_FOLDER_STRUCTURE=uploads/{year}/{month}
```

## 📖 Usage

### Admin Interface

#### File Manager

- **Access**: Admin → S3 Storage
- **Upload**: Drag & drop or click to select files
- **Download**: Click download icon next to any file
- **Delete**: Select files and use bulk delete or individual delete
- **Search**: Use the search box to find specific files
- **Filter**: Sort by name, date, or size

#### Settings Configuration

- **Access**: Admin → S3 Settings
- **Test Connection**: Verify your AWS credentials
- **File Restrictions**: Set allowed file types and size limits
- **Folder Structure**: Customize how files are organized

### Dashboard Widgets

#### Storage Statistics

- Total files uploaded
- Storage space used
- Connection status
- Bucket information

#### Recent Uploads

- Last 5 uploaded files
- Quick download and URL copy
- File type indicators
- Upload timestamps

### API Endpoints

The plugin provides REST API endpoints for programmatic access:

#### Upload File

```bash
POST /api/plugin-routes/s3/upload
Content-Type: multipart/form-data

# Form data:
# file: [file to upload]
# folder: [optional folder path]
```

#### Download File

```bash
GET /api/plugin-routes/s3/download/{fileKey}
```

#### Delete File

```bash
DELETE /api/plugin-routes/s3/delete/{fileKey}
```

#### List Files

```bash
GET /api/plugin-routes/s3/list?prefix={folder}&limit=100&sort=date&order=desc
```

#### Get Statistics

```bash
GET /api/plugin-routes/s3/stats
```

## 🔒 Security Features

### File Validation

- **File Type Restrictions**: Configurable allowed MIME types
- **Size Limits**: Maximum file size per upload
- **Name Sanitization**: Automatic filename cleaning
- **Virus Scanning**: Hook for antivirus integration

### Access Control

- **Admin Only**: File management restricted to admin users
- **Permission Checking**: API endpoints validate user permissions
- **Secure URLs**: Signed URLs for private files
- **Public Access Control**: Optional public read configuration

## 📊 Monitoring & Analytics

### Built-in Statistics

- Upload counts and trends
- Storage usage tracking
- File type breakdown
- Performance metrics

### Logging

- Comprehensive error logging
- Upload/download activity tracking
- Configuration change auditing
- Performance monitoring

### Health Checks

- S3 connection status
- Bucket accessibility
- Permission validation
- Storage quota monitoring

## 🛠️ Advanced Configuration

### Custom Folder Structure

Use these variables in your folder structure pattern:

- `{year}` - Current year (2024)
- `{month}` - Current month (01-12)
- `{day}` - Current day (01-31)

Examples:

- `uploads/{year}/{month}` → `uploads/2024/03`
- `files/{year}-{month}-{day}` → `files/2024-03-15`
- `assets/images/{year}` → `assets/images/2024`

### File Type Configuration

Supported MIME types:

- **Images**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Documents**: `application/pdf`, `application/msword`, `text/plain`
- **Media**: `video/mp4`, `audio/mpeg`
- **Archives**: `application/zip`

### Performance Tuning

```javascript
// Recommended settings for production
{
  "maxFileSize": 10,           // MB
  "allowedTypes": [            // Restrict to needed types
    "image/jpeg",
    "image/png",
    "application/pdf"
  ],
  "publicRead": false,         // Use signed URLs
  "folderStructure": "uploads/{year}/{month}"
}
```

## 🔍 Troubleshooting

### Common Issues

#### Connection Failed

- Verify AWS credentials are correct
- Check bucket name and region
- Ensure IAM user has required permissions
- Test internet connectivity

#### Upload Failures

- Check file size limits
- Verify file type is allowed
- Ensure sufficient S3 permissions
- Check bucket storage limits

#### Access Denied

- Verify bucket policy allows access
- Check IAM user permissions
- Ensure bucket exists in specified region
- Validate Access Key is active

### Error Codes

| Code                        | Description              | Solution                    |
| --------------------------- | ------------------------ | --------------------------- |
| `InvalidAccessKeyId`        | Invalid AWS Access Key   | Check credentials           |
| `SignatureDoesNotMatch`     | Invalid Secret Key       | Verify secret key           |
| `NoSuchBucket`              | Bucket doesn't exist     | Create bucket or check name |
| `AccessDenied`              | Insufficient permissions | Update IAM policy           |
| `InvalidLocationConstraint` | Wrong region             | Update region setting       |

### Debug Mode

Enable detailed logging by setting environment variable:

```bash
DEBUG=s3-storage:*
```

## 📚 API Reference

### Plugin Methods

```javascript
// Upload file
const result = await plugin.uploadFile(buffer, filename, contentType);

// Download file
const file = await plugin.downloadFile(key);

// Delete file
await plugin.deleteFile(key);

// List files
const files = await plugin.listFiles(prefix, maxKeys);

// Get file URL
const url = await plugin.getFileUrl(key, expiresIn);

// Test connection
const status = await plugin.testConnection();
```

### Events

The plugin emits events for integration:

```javascript
// File uploaded
plugin.on("file:uploaded", (data) => {
  console.log("File uploaded:", data.key);
});

// File deleted
plugin.on("file:deleted", (data) => {
  console.log("File deleted:", data.key);
});
```

## 🔄 Updates & Migration

### Updating the Plugin

1. Download the latest version
2. Upload through the admin interface
3. Enable "Overwrite existing" option
4. Test functionality after update

### Data Migration

- Files remain in S3 during plugin updates
- Configuration may need to be reconfigured
- Always backup configuration before updates

## 📞 Support

### Getting Help

1. Check the troubleshooting section above
2. Verify AWS S3 service status
3. Test with AWS CLI to isolate issues
4. Check plugin logs for detailed errors

### Reporting Issues

When reporting issues, include:

- Plugin version
- AWS region
- Error messages
- Steps to reproduce
- Browser/environment details

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

**S3 Storage Manager Plugin** - Powerful, secure, and scalable file storage for your application.
