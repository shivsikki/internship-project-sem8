# Fix for Webpack Dev Server Error

If you're seeing the error:
```
Invalid options object. Dev Server has been initialized using an options object that does not match the API schema.
- options.allowedHosts[0] should be a non-empty string.
```

## Solution 1: Create .env file (Recommended)

Create a file named `.env` in the `frontend` folder with this content:

```
SKIP_PREFLIGHT_CHECK=true
WDS_SOCKET_HOST=localhost
WDS_SOCKET_PORT=3000
DANGEROUSLY_DISABLE_HOST_CHECK=true
```

## Solution 2: Use Environment Variables

**For Windows PowerShell:**
```powershell
$env:WDS_SOCKET_HOST="localhost"
$env:WDS_SOCKET_PORT="3000"
npm start
```

**For Windows CMD:**
```cmd
set WDS_SOCKET_HOST=localhost
set WDS_SOCKET_PORT=3000
npm start
```

**For Linux/Mac:**
```bash
WDS_SOCKET_HOST=localhost WDS_SOCKET_PORT=3000 npm start
```

## Solution 3: Update react-scripts

If the above doesn't work, try updating react-scripts:
```bash
cd frontend
npm install react-scripts@latest
```

Then try `npm start` again.

